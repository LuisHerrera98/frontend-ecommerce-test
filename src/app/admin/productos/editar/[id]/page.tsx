'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { productService } from '@/lib/products'
import { categoryService } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Size } from '@/types'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const productId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    model_name: '',
    brand_name: '',
    category_id: '',
    active: true,
    discount: '0',
    stock: [] as Array<{ size_id: string; size_name: string; quantity: number; available: boolean }>
  })

  // Get product data
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts({}),
  })

  const product = products?.data?.find(p => p._id === productId)

  // Get categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  // Get sizes for selected category
  const { data: categorySizes } = useQuery({
    queryKey: ['sizes-for-category', formData.category_id],
    queryFn: () => productService.getSizesForCategory(formData.category_id),
    enabled: !!formData.category_id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => productService.updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      router.push('/admin/productos')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => productService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      router.push('/admin/productos')
    },
  })

  // Load product data when available
  useEffect(() => {
    if (product) {
      console.log('Product stock:', product.stock) // Debug log
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        model_name: product.model_name || '',
        brand_name: product.brand_name || '',
        category_id: product.category_id || '',
        active: product.active ?? true,
        discount: product.discount?.toString() || '0',
        stock: product.stock || []
      })
    }
  }, [product])

  // Update stock when category sizes change - pero solo si no hemos cargado el stock inicial
  useEffect(() => {
    if (categorySizes && formData.category_id && product && product.stock) {
      console.log('Category sizes:', categorySizes) // Debug log
      console.log('Current product stock:', product.stock) // Debug log
      
      const updatedStock = categorySizes.map((size: Size) => {
        // Buscar si el producto ya tiene stock para esta talla (por nombre de talla)
        const existingProductStock = product.stock.find(s => 
          s.size_name === size.name || s.size_name === size.name.toUpperCase()
        )
        
        console.log(`Size ${size.name} - existing stock:`, existingProductStock) // Debug log
        
        return {
          size_id: size._id,
          size_name: size.name,
          quantity: existingProductStock?.quantity || 0,
          available: true
        }
      })
      
      console.log('Updated stock:', updatedStock) // Debug log
      setFormData(prev => ({ ...prev, stock: updatedStock }))
    }
  }, [categorySizes, product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updateData = {
      name: formData.name,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      model_name: formData.model_name,
      brand_name: formData.brand_name,
      category_id: formData.category_id,
      active: formData.active,
      discount: parseFloat(formData.discount),
      stock: formData.stock
    }

    updateMutation.mutate(updateData)
  }

  const updateStockQuantity = (sizeId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      stock: prev.stock.map(item =>
        item.size_id === sizeId ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    }))
  }

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate()
    }
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500">Cargando producto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/productos')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
            <p className="text-sm text-gray-600">Código: {product.code}</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Imagen del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <span>Sin imagen</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre del producto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories?.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_name">Marca</Label>
                  <Input
                    id="brand_name"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    placeholder="Marca del producto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model_name">Modelo</Label>
                  <Input
                    id="model_name"
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    placeholder="Modelo del producto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Precios y Descuentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Costo</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock by Size */}
          {formData.stock.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventario por Talla</CardTitle>
                <p className="text-sm text-gray-600">Gestiona el stock disponible para cada talla</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.stock.map((stockItem) => (
                    <div key={stockItem.size_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-700">{stockItem.size_name}</span>
                          </div>
                          <span className="font-medium text-gray-700">Talla {stockItem.size_name}</span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          stockItem.quantity > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {stockItem.quantity > 0 ? `${stockItem.quantity} unidades` : 'Sin stock'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateStockQuantity(stockItem.size_id, stockItem.quantity - 1)}
                          className="h-9 w-9 p-0 rounded-full"
                          disabled={stockItem.quantity <= 0}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          value={stockItem.quantity}
                          onChange={(e) => updateStockQuantity(stockItem.size_id, parseInt(e.target.value) || 0)}
                          className="h-9 text-center font-semibold"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateStockQuantity(stockItem.size_id, stockItem.quantity + 1)}
                          className="h-9 w-9 p-0 rounded-full"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado del Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="active" className="text-sm font-medium">Producto Activo</Label>
                  <p className="text-xs text-gray-600">Determina si el producto está visible en la tienda</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${formData.active ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delete Section */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Eliminar Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-red-600">Esta acción no se puede deshacer. Se eliminará el producto permanentemente junto con todas sus imágenes.</p>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Producto'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
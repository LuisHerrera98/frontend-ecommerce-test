export interface Product {
  _id: string
  name: string
  code: string
  category_id?: string
  model_name?: string
  brand_name?: string
  cost: number
  price: number
  discount: number
  active: boolean
  images: ProductImage[]
  stock: ProductStock[]
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  url: string
  publicId: string
}

export interface ProductStock {
  size_id: string
  size_name: string
  quantity: number
  available: boolean
}

export interface Category {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Size {
  _id: string
  name: string
  category_id: string
  createdAt: string
  updatedAt: string
}

export interface Brand {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Sell {
  _id: string
  product_id: string
  product_name: string
  size_id: string
  size_name: string
  price: number
  cost: number
  images: ProductImage[]
  createdAt: string
}

export interface CreateProductDto {
  name: string
  category_id?: string
  model_name?: string
  brand_name?: string
  cost: number
  price: number
  discount?: number
  active?: boolean
  stock: Omit<ProductStock, 'available'>[]
}

export interface UpdateProductDto {
  name?: string
  category_id?: string
  model_name?: string
  brand_name?: string
  cost?: number
  price?: number
  discount?: number
  active?: boolean
  stock?: ProductStock[]
  images?: ProductImage[]
}

export interface ProductFilters {
  categoryId?: string
  brandName?: string
  modelName?: string
  sizeName?: string
  page?: number
  limit?: number
}

export interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  totalPages: number
  filters?: ProductFilters
}

export interface FiltersResponse {
  brands: string[]
  models: string[]
  sizes: string[]
}
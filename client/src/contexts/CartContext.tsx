import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addCartItem,
  CartApiError,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '@/api/cart.ts'
import { useAuth } from '@/contexts/AuthContext.tsx'
import type { Cart } from '@/types/cart.ts'

const EMPTY_CART: Cart = {
  id: '',
  userId: '',
  items: [],
  totals: { subtotal: 0, itemCount: 0, lineCount: 0 },
}

type AddToBagParams = {
  productSlug: string
  variantId: string
  quantity?: number
}

type CartContextValue = {
  cart: Cart
  isLoading: boolean
  isOpen: boolean
  bagCount: number
  actionError: string | null
  openDrawer: () => void
  closeDrawer: () => void
  refreshCart: () => Promise<void>
  addToBag: (params: AddToBagParams) => Promise<boolean>
  setLineQuantity: (itemId: string, quantity: number) => Promise<void>
  removeLine: (itemId: string) => Promise<void>
  clearActionError: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const [cart, setCart] = useState<Cart>(EMPTY_CART)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCart(EMPTY_CART)
      return
    }
    setIsLoading(true)
    try {
      const next = await fetchCart()
      setCart(next)
    } catch {
      setCart(EMPTY_CART)
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (authLoading) return
    void refreshCart()
  }, [authLoading, isLoggedIn, refreshCart])

  const openDrawer = useCallback(() => {
    setActionError(null)
    setIsOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsOpen(false)
    setActionError(null)
  }, [])

  const clearActionError = useCallback(() => setActionError(null), [])

  const addToBag = useCallback(
    async (params: AddToBagParams) => {
      setActionError(null)
      if (!isLoggedIn) {
        navigate('/login')
        return false
      }
      setIsLoading(true)
      try {
        const next = await addCartItem(params)
        setCart(next)
        setIsOpen(true)
        return true
      } catch (err) {
        const message =
          err instanceof CartApiError ? err.message : '장바구니에 담지 못했습니다.'
        setActionError(message)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [isLoggedIn, navigate]
  )

  const setLineQuantity = useCallback(async (itemId: string, quantity: number) => {
    setActionError(null)
    setIsLoading(true)
    try {
      const next = await updateCartItem(itemId, quantity)
      setCart(next)
    } catch (err) {
      const message =
        err instanceof CartApiError ? err.message : '수량 변경에 실패했습니다.'
      setActionError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeLine = useCallback(async (itemId: string) => {
    setActionError(null)
    setIsLoading(true)
    try {
      const next = await removeCartItem(itemId)
      setCart(next)
    } catch (err) {
      const message =
        err instanceof CartApiError ? err.message : '삭제에 실패했습니다.'
      setActionError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const bagCount = cart.totals.itemCount

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      isOpen,
      bagCount,
      actionError,
      openDrawer,
      closeDrawer,
      refreshCart,
      addToBag,
      setLineQuantity,
      removeLine,
      clearActionError,
    }),
    [
      cart,
      isLoading,
      isOpen,
      bagCount,
      actionError,
      openDrawer,
      closeDrawer,
      refreshCart,
      addToBag,
      setLineQuantity,
      removeLine,
      clearActionError,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}

import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productFound = cart.find((product) => product.id === productId);

      if (productFound) {
        updateProductAmount({ productId, amount: productFound.amount + 1 });
      } else {
        const stock: Stock = await (await api.get(`stock/${productId}`)).data;
        const product: Product = await (
          await api.get(`products/${productId}`)
        ).data;

        if (product.amount >= stock.amount || product.amount < 1) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          setCart([...cart, { ...product, amount: 1 }]);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, { ...product, amount: 1 }])
          );
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productFound = cart.find((product) => product.id === productId);

      if (productFound) {
        const newCart = cart.filter((product) => product.id !== productId);

        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productFound = cart.find((product) => product.id === productId);
      const stock: Stock = await (await api.get(`stock/${productId}`)).data;

      if (productFound) {
        if (amount < 1) return;

        if (amount > stock.amount) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          let updatedCart: Product[] = [];
          cart.map((product) => {
            if (product.id === productId) {
              updatedCart.push({ ...product, amount });
            } else {
              updatedCart.push(product);
            }
          });

          setCart(updatedCart);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify(updatedCart)
          );
        }
      } else {
        toast.error("Erro na alteração de quantidade do produto");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

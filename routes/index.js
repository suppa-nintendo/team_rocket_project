const apiRouter = require("express").Router();

const {
  getAllProducts,
  getProductById,
  getAllTypes,
  db_addCartItem,
  db_patchCartItem,
  db_deleteCartItem,
} = require("../db/index");

apiRouter.get("/", (req, res, next) => {
  res.send({
    message: "API is under construction!",
  });
});

apiRouter.get("/products", async (req, res, next) => {
  try {
    const products = await getAllProducts();
    res.send(products);
  } catch (error) {
    throw error;
  }
});

apiRouter.get("/products/:product_id", async (req, res, next) => {
  console.log;
  try {
    const { product_id } = req.params;
    const product = await getProductById(product_id);
    res.send(product);
  } catch (error) {
    throw error;
  }
});

apiRouter.get("/products/types", async (req, res, next) => {
  try {
    const types = await getAllTypes();
    res.send(types);
  } catch (error) {
    throw error;
  }
});

apiRouter.post(`/cart/:cart_id/:prod_id`, async (req, res, next) => {
  const { cart_id, prod_id } = req.params;
  const { price, cart_quantity } = req.body;
  try {
    const cart = await db_addCartItem(cart_id, prod_id, cart_quantity, price);
    res.send(cart);
  } catch (error) {
    next(error);
  }
});

apiRouter.patch(`/cart/:cart_id/:prod_id`, async (req, res, next) => {
  const { cart_id, prod_id } = req.params;
  const { cart_quantity } = req.body;
  try {
    const messageObj = await db_patchCartItem(cart_id, prod_id, cart_quantity);
    res.send(messageObj);
  } catch (error) {
    next(error);
  }
});

apiRouter.delete(`/cart/:cart_id/:prod_id`, async (req, res, next) => {
  const { cart_id, prod_id } = req.params;
  try {
    const messageObj = await db_deleteCartItem(cart_id, prod_id);
    res.send(messageObj);
  } catch (error) {
    next(error);
  }
});

apiRouter.use("/customers", require("./customers"));
apiRouter.use("/login", require("./customers"));
apiRouter.use("/register", require("./customers"));

const usersRouter = require('./checkout');
apiRouter.use('/checkout', usersRouter);

module.exports = apiRouter;

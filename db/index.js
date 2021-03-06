// Connect to DB
require("dotenv").config();
const { Client } = require("pg");
const DB_URL = process.env.DATABASE_URL;
const client = new Client(DB_URL);

// import data from db_data_pokemon
const { type, allPokes } = require("./db_data_pokemon.js");

// database methods

async function createAllTypeEntries(collection) {
  console.log("Type collection:", collection);
  for (const index in collection) {
    const entry = await createTypeEntry(collection[index]);
  }
}

async function createTypeEntry({ name }) {
  console.log(`Adding ${name} to the database...`);
  try {
    const {
      rows: [entry],
    } = await client.query(
      `
      INSERT INTO type(name)
      VALUES ($1)
      RETURNING *
    `,
      [name]
    );
    console.log("Entry complete:", entry);
    console.log(" ");
    return entry;
  } catch (error) {
    throw error;
  }
}

async function createAllPokeEntries(collection) {
  console.log("Pokemon collection:", collection);
  for (const index in collection) {
    const entry = await createPokeEntry(collection[index]);
  }
}

async function createPokeEntry({
  dex_id,
  name,
  type,
  description,
  height,
  weight,
  price,
}) {
  console.log(`Adding ${name} to the database...`);
  // randomly generates stock
  let stock = Math.floor(Math.random() * (100 - 30) + 30);
  try {
    const {
      rows: [entry],
    } = await client.query(
      `
      INSERT INTO product(dex_id, name, description, height, weight, price,quantity)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
      [dex_id, name, description, height, weight, price, stock]
    );

    await createAllTypeRelations(type, entry.prod_id, name);

    console.log("Entry complete:", entry);
    console.log(" ");
    return entry;
  } catch (error) {
    throw error;
  }
}
async function createAllTypeRelations(type_collection, prod_id, prod_name) {
  console.log(`Creating type relations for ${prod_name}`);
  for (const type_id of type_collection) {
    const entry = await createTypeRelation(type_id, prod_id);
  }
}

async function createTypeRelation(type_id, prod_id) {
  try {
    const {
      rows: [entry],
    } = await client.query(
      `
      INSERT INTO product_type(prod_id, type_id)
      VALUES ($1,$2)
      RETURNING *
    `,
      [prod_id, type_id]
    );
    console.log("Type relationship entry complete:", entry);
  } catch (error) {
    throw error;
  }
}

async function getAllProducts() {
  try {
    const { rows: pokemon } = await client.query(
      `SELECT * FROM product WHERE is_active = true`
    );
    const addTypes = await _buildTypes(pokemon);
    const products = await _buildFeaturedProducts(addTypes);
    return products;
  } catch (error) {
    throw error;
  }
}

async function db_countActiveProducts() {
  try {
    const { rows } = await client.query(
      `SELECT COUNT (*) FROM product WHERE is_active = true`
    );

    console.log("TEST OF COUNT", rows);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_countInactiveProducts() {
  try {
    const { rows } = await client.query(
      `SELECT COUNT (*) FROM product WHERE is_active = false`
    );

    console.log("TEST OF COUNT", rows);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_getAllProductsAdmin() {
  try {
    const { rows: pokemon } = await client.query(`SELECT * FROM product`);
    const addTypes = await _buildTypes(pokemon);
    const products = await _buildFeaturedProducts(addTypes);
    return products;
  } catch (error) {
    throw error;
  }
}

async function getProductById(id) {
  try {
    const { rows: pokemon } = await client.query(
      `SELECT * FROM product WHERE prod_id = ${id}`
    );
    // builds types array into the pokemon object
    const [product] = await _buildTypes(pokemon);

    // builds the reviews array into the product object
    const product_reviews = await db_getReviewsByProductId(id);
    product.reviews = [...product_reviews];

    return product;
  } catch (error) {
    throw error;
  }
}

async function _buildTypes(array) {
  try {
    const { rows: type_relations } = await client.query(`
      SELECT prod_id, name FROM product_type
      LEFT JOIN type on product_type.type_id = type.type_id
    `);
    let products = [...array];

    for (let product of products) {
      product.type = [];
      for (let type of type_relations) {
        if (type.prod_id === product.prod_id) {
          product.type.push(type.name);
        }
      }
    }

    return products;
  } catch (error) {
    throw error;
  }
}

async function _buildFeaturedProducts(array) {
  //todo find a way to grab last month based on current date!
  const featuredProdArray = await db_getTopSalesDatabyMonth(12, 2020);
  console.log("featuredProdArray:", featuredProdArray);
  try {
    for (let product of array) {
      for (let index of featuredProdArray) {
        if (index.prod_id === product.prod_id) {
          product.is_featured = true;
        }
      }
    }
    return array;
  } catch (error) {
    throw error;
  }
}

async function db_getAllTypes() {
  try {
    const { rows: types } = await client.query(`
      SELECT *
      FROM type
    `);
    return types;
  } catch (error) {
    throw error;
  }
}

async function db_addCartItem(cart_id, prod_id, cart_quantity, price) {
  try {
    await client.query(
      `
      INSERT INTO cart_items(cart_id, prod_id, cart_quantity, cart_price)
      VALUES ($1, $2, $3, $4);
    `,
      [cart_id, prod_id, cart_quantity, price]
    );

    const products = await _getUserCart(cart_id);

    const cart = await _buildTypes(products);

    return cart;
  } catch (error) {
    throw error;
  }
}

async function _getUserCart(cart_id) {
  try {
    const { rows: cart } = await client.query(
      `
      SELECT * FROM product
      NATURAL JOIN cart_items
      WHERE cart_id=$1;
    `,
      [cart_id]
    );
    return cart;
  } catch (error) {
    throw error;
  }
}

async function db_patchCartItem(cart_id, prod_id, cart_quantity) {
  try {
    await client.query(
      `
      UPDATE cart_items
      SET cart_quantity=$1
      WHERE cart_id=${cart_id} AND prod_id=${prod_id};
    `,
      [cart_quantity]
    );
    return { message: "Success, Cart updated" };
  } catch (error) {
    throw error;
  }
}

async function db_updateCart(cart_id, cart) {
  const valueString = cart
    .map(
      (_, index) =>
        `$1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4}`
    )
    .join(`), (`);
  const valueArray = [];
  try {
    await db_clearUserCart(cart_id);
    for (let item of cart) {
      const price = await db_getItemPrice(item.prod_id);
      valueArray.push(item.prod_id, item.cart_quantity, price);
    }
    await client.query(
      `
      INSERT INTO cart_items(cart_id, prod_id, cart_quantity, cart_price)
        VALUES (${valueString});
    `,
      [cart_id, ...valueArray]
    );
    const masterCart = await _getUserCart(cart_id);
    return masterCart;
  } catch (error) {
    throw error;
  }
}

async function db_deleteCartItem(cart_id, prod_id) {
  try {
    await client.query(`
      DELETE FROM cart_items
      WHERE cart_id=${cart_id} AND prod_id=${prod_id}
    `);
    return { message: "Success, item removed from your cart." };
  } catch (error) {
    throw error;
  }
}

async function _getUserCart(cart_id) {
  try {
    const { rows: cart } = await client.query(
      `
      SELECT * FROM product
      NATURAL JOIN cart_items
      WHERE cart_id=$1;
    `,
      [cart_id]
    );
    return cart;
  } catch (error) {
    throw error;
  }
}

// Customer Methods //

async function db_createCustomer({
  first_name,
  last_name,
  cust_email,
  cust_pwd,
  is_admin,
}) {
  try {
    const { rows } = await client.query(
      `
    
    INSERT INTO customers(
      first_name,
      last_name,
      cust_email,
      cust_pwd,
      is_admin)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT (cust_email) DO NOTHING
      RETURNING *;
    
    `,
      [first_name, last_name, cust_email, cust_pwd, is_admin]
    );
    const cart_id = await _createUserCart(rows[0].cust_id);
    rows[0].cart_id = cart_id.cart_id;

    return rows;
  } catch (error) {
    throw error;
  }
}

async function _createUserCart(cust_id) {
  try {
    const {
      rows: [cart_id],
    } = await client.query(
      `
      INSERT INTO cart_cust_relate(cust_id)
        VALUES ($1)
        RETURNING cart_id;
    `,
      [cust_id]
    );

    return cart_id;
  } catch (error) {
    throw error;
  }
}

async function db_getAllCustomers() {
  try {
    const { rows } = await client.query(`
      SELECT *
      FROM customers;
    `);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_getCustomerById(customerID) {
  try {
    const {
      rows: [customer],
    } = await client.query(`
      SELECT *
      FROM customers
      WHERE cust_id=${customerID};
    `);

    if (!customer) {
      return null;
    }

    return customer;
  } catch (error) {
    throw error;
  }
}

async function db_getCustomerByEmail(cust_email) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
      SELECT *
      FROM customers
      WHERE cust_email=$1;
    `,
      [cust_email]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

async function db_getCustomerCart(cust_email) {
  try {
    const customer = await db_getCustomerByEmail(cust_email);
    const cart = await _getUserCart(customer.cust_id);

    const {
      rows: [cartID],
    } = await client.query(
      `
      SELECT *
      FROM cart_cust_relate
      WHERE cust_id=$1;
    `,
      [`${customer.cust_id}`]
    );

    return { cartID: cartID.cart_id, cart };
  } catch (error) {
    throw error;
  }
}

// admin methods

async function db_updateProduct(prod_id, attributes) {
  const { price, quantity, is_active } = attributes;
  try {
    const {
      rows: [product],
    } = await client.query(
      `
      UPDATE product
      SET price=$1, 
      quantity=$2,
      is_active=$3
      WHERE prod_id=${prod_id}
      RETURNING name;
    `,
      [price, quantity, is_active]
    );

    return product;
  } catch (error) {
    throw error;
  }
}

async function db_updateCustomer(cust_id, attributes) {
  const { first_name, last_name, cust_email, cust_pwd, is_admin } = attributes;
  try {
    const {
      rows: [customer],
    } = await client.query(
      `
      UPDATE customers
      SET first_name=$1, 
      last_name=$2,
      cust_email=$3,
      cust_pwd=$4,
      is_admin=$5
      WHERE cust_id=${cust_id}
      RETURNING *;
    `,
      [first_name, last_name, cust_email, cust_pwd, is_admin]
    );

    return customer;
  } catch (error) {
    throw error;
  }
}

// checkout methods

async function db_getItemPrice(prod_id) {
  try {
    const {
      rows: [price],
    } = await client.query(
      `
      SELECT price FROM product
      WHERE prod_id = $1;
    `,
      [prod_id]
    );
    return price.price;
  } catch (error) {
    throw error;
  }
}

async function db_recordGuestOrder(cart, formInfo) {
  try {
    const orderId = await db_createOrderId(1);
    await db_addOrderItems(cart, orderId);
    await _createGuest_Order(orderId, formInfo);
  } catch (error) {
    throw error;
  }
}

async function db_createOrderId(cust_id) {
  try {
    const {
      rows: [orderId],
    } = await client.query(`
      INSERT INTO order_cust_relate(cust_id)
        VALUES (${cust_id})
        RETURNING order_id;
    `);
    return orderId.order_id;
  } catch (error) {
    throw error;
  }
}

async function db_addOrderItems(cart, order_id) {
  const valueString = cart
    .map(
      (_, index) =>
        `$1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4}`
    )
    .join(`), (`);
  const valueArray = [];
  try {
    for (let item of cart) {
      const price = await db_getItemPrice(item.prod_id);
      valueArray.push(item.prod_id, item.cart_quantity, price);
      await client.query(
        `
        UPDATE product
          SET quantity = product.quantity - $1
          WHERE prod_id=$2;
      `,
        [item.cart_quantity, item.prod_id]
      );
    }
    await client.query(
      `
      INSERT INTO order_detail(order_id, prod_id, order_quantity, order_price)
        VALUES (${valueString});
    `,
      [order_id, ...valueArray]
    );
  } catch (error) {
    throw error;
  }
}

async function _createGuest_Order(orderId, formInfo) {
  const {
    contactInfo: { firstName, lastName, email },
    shipInfo,
    billInfo,
  } = formInfo;
  try {
    await client.query(
      `
      INSERT INTO guest_order(order_id, guest_first_name, guest_last_name, guest_email, ship_add1, ship_add2, ship_city, ship_state, ship_zipcode, bill_add1, bill_add2, bill_city, bill_state, bill_zipcode)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14);
    `,
      [
        orderId,
        firstName,
        lastName,
        email,
        shipInfo.add1,
        shipInfo.add2,
        shipInfo.city,
        shipInfo.state,
        shipInfo.zipcode,
        billInfo.add1,
        billInfo.add2,
        billInfo.city,
        billInfo.state,
        billInfo.zipcode,
      ]
    );
  } catch (error) {
    throw error;
  }
}

async function db_createProductReview(reviewObject) {
  const {
    prod_id,
    cust_id,
    review_title,
    review_comment,
    rating,
  } = reviewObject;
  console.log("Attempting to create a new review!");
  try {
    const {
      rows: [customer_review],
    } = await client.query(
      `
      INSERT INTO product_reviews(prod_id, cust_id, review_title, review_comment, rating)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `,
      [prod_id, cust_id, review_title, review_comment, rating]
    );
    return customer_review;
  } catch (error) {
    console.log(
      `Trouble creating a review for product ID ${prod_id} from customer ID ${cust_id}!`
    );
    throw error;
  }
}

async function db_createSampleProductReviews(array) {
  for (let entry of array) {
    const review = await db_createProductReview(entry);
  }
}

async function db_getOrderHistoryByCustomerId(customerId) {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM order_cust_relate
      WHERE cust_id = $1;
    `,
      [customerId]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_getOrderDetailsbyOrderId(orderId) {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM order_detail
      NATURAL JOIN product
      WHERE order_id = $1;
    `,
      [orderId]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_getReviewsByProductId(prod_id) {
  try {
    const { rows: reviews } = await client.query(
      `
      SELECT review_id, rating, review_title, review_comment, first_name
      FROM product_reviews
      LEFT JOIN customers on product_reviews.cust_id = customers.cust_id
      WHERE prod_id = ${prod_id}`
    );
    return reviews;
  } catch (error) {
    console.log("Trouble getting reviews by product ID in the database!");
    throw error;
  }
}

async function db_getSalesDatabyProductID(prodID) {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM sales
      NATURAL JOIN product
      WHERE prod_id = $1;
    `,
      [prodID]
    );

    console.log(rows);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_getSalesDatabyMonth(month, year) {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM sales
      NATURAL JOIN product
      WHERE EXTRACT(MONTH FROM transaction_date) = $1
      AND EXTRACT(Year FROM transaction_date) = $2;
    `,
      [month, year]
    );

    // console.log(rows);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_getTopSalesDatabyMonth(month, year) {
  try {
    const { rows } = await client.query(
      `
      SELECT  sum(order_quantity), prod_id 
      FROM sales
      WHERE EXTRACT(MONTH FROM transaction_date) = $1
      AND EXTRACT(Year FROM transaction_date) = $2
      group by prod_id
      Order by sum(order_quantity) desc
      limit 5;
    `,
      [month, year]
    );

    console.log(rows);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_joinTopSales(month, year) {
  const topSales = await db_getTopSalesDatabyMonth(month, year);

  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM product  
    `
    );
    const topSalesArr = [];
    const result = rows.map((row, index) => {
      console.log("this is the prod id", row.prod_id);
      const topItem = topSales.map((sale, index) => {
        if (row.prod_id === sale.prod_id) {
          topSalesArr.push({
            prodID: row.prod_id,
            poke_name: row.name,
            DEX: row.dex_id,
          });

          return topSalesArr;
        }
      });
    });

    console.log("FINAL TEST OF TOP SALES ARR", topSalesArr);
    return topSalesArr;
  } catch (error) {
    throw error;
  }
}

async function db_getTotalSales(month, year) {
  const totalSales = await db_getSalesDatabyMonth(month, year);

  try {
    const salesArr = [];

    totalSales.map((sale) => {
      const values = salesArr.push(sale.order_quantity * sale.price);

      return values;
    });

    var sum = salesArr.reduce(function (a, b) {
      return a + b;
    }, 0);

    console.log("THIS IS THE SUM", sum.toFixed(2));
    return sum.toFixed(2);
  } catch (error) {
    throw error;
  }
}

async function db_getLastSixMonths(month, year) {
  console.log("I just ran XXXXXXXXXX");
  const month2 = parseInt(month) === 1 ? 12 : month - 1;
  const year2 = month === 1 ? year - 1 : year;

  const month3 = month2 === 1 ? 12 : month2 - 1;
  const year3 = month2 === 1 ? year - 1 : year2;

  const month4 = month3 === 1 ? 12 : month3 - 1;
  const year4 = month3 === 1 ? year - 1 : year3;

  const month5 = month4 === 1 ? 12 : month4 - 1;
  const year5 = month4 === 1 ? year - 1 : year4;

  const month6 = month5 === 1 ? 12 : month5 - 1;
  const year6 = month5 === 1 ? year - 1 : year5;

  try {
    const value_one = await db_getTotalSales(month, year);
    const forecast_one = await db_getSalesForecast(month, year);
    const value_two = await db_getTotalSales(month2, year2);
    const forecast_two = await db_getSalesForecast(month2, year2);
    const value_three = await db_getTotalSales(month3, year3);
    const forecast_three = await db_getSalesForecast(month3, year3);
    const value_four = await db_getTotalSales(month4, year4);
    const forecast_four = await db_getSalesForecast(month4, year4);
    const value_five = await db_getTotalSales(month5, year5);
    const forecast_five = await db_getSalesForecast(month5, year5);
    const value_six = await db_getTotalSales(month6, year6);
    const forecast_six = await db_getSalesForecast(month6, year6);

    return [
      { value: value_one, forecast: forecast_one, month: month, year: year },
      { value: value_two, forecast: forecast_two, month: month2, year: year2 },
      {
        value: value_three,
        forecast: forecast_three,
        month: month3,
        year: year3,
      },
      {
        value: value_four,
        forecast: forecast_four,
        month: month4,
        year: year4,
      },
      {
        value: value_five,
        forecast: forecast_five,
        month: month5,
        year: year5,
      },
      { value: value_six, forecast: forecast_six, month: month6, year: year6 },
    ];
  } catch (error) {
    throw error;
  }
}

async function db_getSalesForecast(month, year) {
  const totalSales = await db_getSalesDatabyMonth(month, year);

  try {
    const salesArr = [];

    totalSales.map((sale) => {
      const values = salesArr.push(sale.forecast_quantity * sale.price);

      return values;
    });

    var sum = salesArr.reduce(function (a, b) {
      return a + b;
    }, 0);

    console.log("THIS IS THE SUM", sum.toFixed(2));
    return sum.toFixed(2);
  } catch (error) {
    throw error;
  }
}

async function db_getSalesData() {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM sales
      NATURAL JOIN product;
    `
    );
    console.log(rows);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_generateSale(order_id, prod_id, order_quantity, order_price) {
  try {
    await client.query(
      `
      INSERT INTO sales(order_id, prod_id, order_quantity, order_price)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `,
      [order_id, prod_id, order_quantity, order_price]
    );
  } catch (error) {
    throw error;
  }
}

async function db_getUserShipInfo(cust_id) {
  try {
    const {
      rows: [shipInfo],
    } = await client.query(
      `
      SELECT * FROM shipping_add
        WHERE cust_id = $1;
    `,
      [cust_id]
    );
    return shipInfo;
  } catch (error) {
    throw error;
  }
}

async function db_recordShipping(cust_id, shipInfo) {
  const { add1, add2, city, state, zipcode } = shipInfo;
  try {
    await client.query(
      `
      INSERT INTO shipping_add(cust_id, ship_add1, ship_add2, ship_city, ship_state, ship_zipcode)
        VALUES ($1, $2, $3, $4, $5, $6);
    `,
      [cust_id, add1, add2, city, state, zipcode]
    );
    return;
  } catch (error) {
    throw error;
  }
}

async function db_recordBilling(cust_id, billInfo) {
  const { add1, add2, city, state, zipcode } = billInfo;
  try {
    const { rows } = await client.query(
      `
      INSERT INTO billing_add(cust_id, bill_add1, bill_add2, bill_city, bill_state, bill_zipcode)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `,
      [cust_id, add1, add2, city, state, zipcode]
    );
    return;
  } catch (error) {
    throw error;
  }
}

async function db_clearUserCart(cart_id) {
  try {
    const { rows } = await client.query(
      `
      DELETE FROM cart_items
        WHERE cart_id = $1;
    `,
      [cart_id]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function db_getUserOrderHistory(cust_id) {
  const order_history = [];
  try {
    const { rows: history } = await client.query(
      `
    SELECT order_id, order_date, order_quantity, order_price, dex_id, product.name
      FROM order_cust_relate
      NATURAL JOIN order_detail
      NATURAL JOIN product
      WHERE cust_id=$1
      ORDER BY order_date ASC;
    `,
      [cust_id]
    );
    if (history.length) {
      order_history.push(..._sortHistory(history));
    }
    return order_history;
  } catch (error) {
    throw error;
  }
}

function _sortHistory(history) {
  const order_history = [];
  const order_ids = new Set(history.map((x) => x.order_id));
  for (let id of order_ids) {
    let date = "";
    const orderbydate = [];
    for (let order of history) {
      if (id === order.order_id) {
        orderbydate.push(order);
        date = order.order_date;
      }
    }
    order_history.push({ date, order: orderbydate });
  }
  return order_history;
}

async function db_getUserProfile(cust_id) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
    SELECT * FROM customers
      NATURAL JOIN shipping_add
      NATURAL JOIN billing_add
        WHERE cust_id=$1
    `,
      [cust_id]
    );

    if (!user) {
      const {
        rows: [userX],
      } = await client.query(
        `
        SELECT * FROM customers
          WHERE cust_id=$1;
      `,
        [cust_id]
      );
      delete userX.password;
      return {
        ...userX,
        ship_add1: "",
        ship_add2: "",
        ship_city: "",
        ship_state: "",
        ship_zipcode: "",
        bill_add1: "",
        bill_add2: "",
        bill_city: "",
        bill_state: "",
        bill_zipcode: "",
      };
    }
    delete user.cust_pwd;
    return user;
  } catch (error) {
    throw error;
  }
}

async function db_updateUserContact(cust_id, user) {
  try {
    const {
      rows: [userInfo],
    } = await client.query(
      `
      UPDATE customers
        SET first_name=$1,
            last_name=$2,
            cust_email=$3
        WHERE cust_id=$4
      RETURNING first_name, last_name, cust_email;
    `,
      [user.first_name, user.last_name, user.cust_email, cust_id]
    );
    return userInfo;
  } catch (error) {
    throw error;
  }
}

async function db_updateUserShipping(cust_id, user) {
  const { ship_add1, ship_add2, ship_city, ship_state, ship_zipcode } = user;
  try {
    const {
      rows: [shipInfo],
    } = await client.query(
      `
      UPDATE shipping_add
        SET ship_add1=$1,
            ship_add2=$2,
            ship_city=$3,
            ship_state=$4,
            ship_zipcode=$5
        WHERE cust_id=$6
      RETURNING *;
    `,
      [ship_add1, ship_add2, ship_city, ship_state, ship_zipcode, cust_id]
    );
    return shipInfo;
  } catch (error) {
    throw error;
  }
}

async function db_updateUserBilling(cust_id, user) {
  const { bill_add1, bill_add2, bill_city, bill_state, bill_zipcode } = user;
  try {
    const {
      rows: [billInfo],
    } = await client.query(
      `
      UPDATE billing_add
        SET bill_add1=$1,
            bill_add2=$2,
            bill_city=$3,
            bill_state=$4,
            bill_zipcode=$5
        WHERE cust_id=$6
      RETURNING *;
    `,
      [bill_add1, bill_add2, bill_city, bill_state, bill_zipcode, cust_id]
    );
    return billInfo;
  } catch (error) {
    throw error;
  }
}

// export

module.exports = {
  client,
  // db methods
  createAllTypeEntries,
  createAllPokeEntries,
  getAllProducts,
  getProductById,
  db_getAllTypes,
  db_addCartItem,
  db_patchCartItem,
  db_deleteCartItem,
  db_createCustomer,
  db_getAllCustomers,
  db_getCustomerById,
  db_getCustomerByEmail,
  db_getCustomerCart,
  db_updateProduct,
  db_getItemPrice,
  db_recordGuestOrder,
  db_getReviewsByProductId,
  db_createProductReview,
  db_createSampleProductReviews,
  db_getOrderHistoryByCustomerId,
  db_getUserShipInfo,
  db_recordShipping,
  db_recordBilling,
  db_createOrderId,
  db_addOrderItems,
  db_clearUserCart,
  db_getOrderDetailsbyOrderId,
  db_getSalesData,
  db_getSalesDatabyProductID,
  db_getSalesDatabyMonth,
  db_getTopSalesDatabyMonth,
  db_updateCart,
  _getUserCart,
  db_getUserOrderHistory,
  db_getUserProfile,
  db_updateUserContact,
  db_updateUserShipping,
  db_updateUserBilling,
  db_getAllProductsAdmin,
  db_updateCustomer,
  db_updateProduct,
  db_joinTopSales,
  db_getTotalSales,
  db_getSalesForecast,
  db_countActiveProducts,
  db_countInactiveProducts,
  db_getLastSixMonths,
  db_generateSale,
};

function orderCollection(db) {
  return db.collection("orders");
}

module.exports = { orderCollection };
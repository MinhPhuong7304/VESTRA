module.exports = (err, req, res, next) => {
  console.error("❌ Hệ thống gặp lỗi:", err.message || err);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Lỗi xử lý hệ thống phía Server"
  });
};

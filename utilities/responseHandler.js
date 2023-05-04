const genericResponse = async (req, res) => {
  const response = {};

  response.statusCode = 200;
  response.data = req.data || {};
  response.message = req.message || 'OK';

  res.status(200).json(response);
  res.end();
};

module.exports = {
  genericResponse
};

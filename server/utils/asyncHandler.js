const asyncHandler = (executionTarget) => {
  return (req, res, next) => {
    Promise.resolve(executionTarget(req, res, next)).catch(next);
  };
};

export default asyncHandler;
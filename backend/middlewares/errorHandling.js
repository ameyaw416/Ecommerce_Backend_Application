//Creating a centralized error handling middleware for Express.js application
const errorHandling = (err, req, res, next) => {
    console.log(err.stack); // Log the error stack trace for debugging
    res.status(500).json({ 
        status: 500,
        message:'Something went wrong', 
        error: err.message,
    });
};
export default errorHandling;
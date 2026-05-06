require("dotenv").config(); 

const app = require("../src/app");
console.log("COOKIES PATH:", process.env.YT_COOKIES_PATH);
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
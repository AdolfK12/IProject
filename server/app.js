const express = require('express')
const app = express()
const path = require('path')
const port = 3000

const cors = require('cors')
const router = require('./routers/router')
 
app.use(express.urlencoded({ extended: true }))
app.use(express.json()) 
app.use(cors()) 
app.use('/uploads', express.static(path.join(__dirname, '/uploads')))


app.use('/', router);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports = app
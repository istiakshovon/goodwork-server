import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from "cors"
import { createRemoteJWKSet, jwtVerify } from 'jose';
const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

const verifytoken = async(req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: "unauthorized" })
    }
    const token = authHeader.split(' ')[1]
    if (!token) {
        return res.status(401).send({ message: "unauthorized" })
    }

    const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))

try {
    const {payload} = await jwtVerify(token,JWKS)
        next()
}catch (error) {
        console.error("JWT ERROR:", error.name, error.message);
        return res.status(401).send({ message: "server error" });
    }




}

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}
const mongoclient = await connectToMongoDB()

const db = mongoclient.db("goodwork")
const eventCollection = db.collection('destination')

const joinEvent = db.collection('JoinEvent')

app.post('/add-destination',verifytoken, async (req, res) => {
    const data = req.body
    const result = await eventCollection.insertOne(data)
    console.log(result)
    res.send(result)
})



app.get('/events',  async (req, res) => {
    const result = await eventCollection.find().toArray()
    res.send(result)
})

app.get('/', (req, res) => {
    res.send({ message: 'server is running' })
})

app.delete('/my-events/:id',verifytoken, async (req, res) => {
    const { id } = req.params
    const result = await joinEvent.deleteOne({ _id: new ObjectId(id) })
    res.send(result)
})

app.post('/join', async (req, res) => {
    const data = req.body
    const result = await joinEvent.insertOne(data)
    res.send(result)
})

app.get('/my-events/:email', async (req, res) => {
    const { email } = req.params
    const result = await joinEvent.find({ email: email }).toArray()
    res.send(result)
})

app.get('/mycreated-events/:email', async (req, res) => {
    const { email } = req.params
    const result = await eventCollection.find({ creatorEmail: email }).toArray()
    res.send(result)
})

app.patch('/event/:id',verifytoken, async (req, res) => {
    const { id } = req.params
    const data = req.body
    const result = await eventCollection.updateOne({ _id: new ObjectId(id) }, { $set: data })
    res.json(result)
})

app.listen(PORT, () => {
    console.log(`server is running at ${PORT}`)
})

export default app
import axios from 'axios'
import dotenv from'dotenv'
import express from 'express'
import serverless from 'serverless-http'
import { OpenAI } from 'langchain/llms/openai'
import { item } from './foodlist'

const app = express()
const router = express.Router()
dotenv.config()

router.post('/webhook', async(req: express.Request, res: express.Response) => {
  const reqBody = JSON.parse(req.body)
  const replyToken = reqBody.events[0].replyToken
  const msg = reqBody.events[0].message.text
  if (msg.indexOf("มื้อนี้กินอะไรดี") > -1) {
    await reply(msg, replyToken, await getFoodFromOpenAI())
  }
  else {
    await reply(msg, replyToken, 'ไม่พบข้อมูล')
  }

  res.sendStatus(200)
})

router.get('/randomFood', (_: express.Request, res: express.Response) => {
  res.json({
    foodname: randomFood()
  })
})

function randomFood(): string {
  const num = Math.floor(Math.random() * item.length + 1)

  return item[num]
}

async function getFoodFromOpenAI(): Promise<string> {
  const model = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0.5, maxTokens: 100 })
  const res = await model.call(
    'สุ่มรายการอาหาร 1 เมนู',
  )

  return res
}

async function reply(msg: string, replyToken: string, answer: string) {
  const foodData = [{
    "type": "flex",
    "altText": answer + "...",
    "contents": {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png",
            "size": "full",
            "aspectRatio": "20:13",
            "aspectMode": "cover",
            "action": {
                "type": "uri",
                "uri": "https://linecorp.com"
            }
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "action": {
                "type": "uri",
                "uri": "https://linecorp.com"
            },
            "contents": [
                {
                    "type": "text",
                    "text": "เมนูอาหารของคุณคือ",
                    "size": "xl",
                    "weight": "bold"
                },
                {
                    "type": "text",
                    "text": answer,
                    "wrap": true,
                    "color": "#aaaaaa",
                    "size": "sm"
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "md",
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "color": "#905c44",
                    "action": {
                        "type": "message",
                        "label": "ลองใหม่!",
                        "text": "มื้อนี้กินอะไรดี?"
                    }
                },
                {
                    "type": "button",
                    "style": "secondary",
                    "color": "#905c44",
                    "action": {
                        "type": "uri",
                        "label": "ค้นหาร้าน",
                        "uri": "https://www.google.co.th/maps/search/%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3"
                    }
                }
            ]
        }
    }
  }]

  const msgData = [
    {
      "type": "text",
      "text": answer
    }
  ]

  const options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer {${process.env.CHANNEL_ACCESS_TOKEN}}`
    }
  }

  await axios.post('https://api.line.me/v2/bot/message/reply', 
  { 
    replyToken: replyToken, 
    messages: msg.indexOf("มื้อนี้กินอะไรดี") > -1? foodData: msgData 
  }, 
  options)
}

app.use('/.netlify/functions/api', router)
module.exports.handler = serverless(app)

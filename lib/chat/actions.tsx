import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  render,
  createStreamableValue
} from 'ai/rsc'
import OpenAI from 'openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import {z} from 'zod'
import {EventsSkeleton} from '@/components/stocks/events-skeleton'
import {Events} from '@/components/stocks/events'
import {StocksSkeleton} from '@/components/stocks/stocks-skeleton'
import {Stocks} from '@/components/stocks/stocks'
import {StockSkeleton} from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import {saveChat} from '@/app/actions'
import {SpinnerMessage, UserMessage} from '@/components/stocks/message'
import {Chat} from '@/lib/types'
import {auth} from '@/auth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'
  
  const aiState = getMutableAIState<typeof AI>()
  
  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )
  
  const systemMessage = createStreamableUI(null)
  
  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)
    
    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )
    
    await sleep(1000)
    
    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )
    
    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )
    
    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(0, -1),
        {
          id: nanoid(),
          role: 'function',
          name: 'showStockPurchase',
          content: JSON.stringify({
            symbol,
            price,
            defaultAmount: amount,
            status: 'completed'
          })
        },
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })
  
  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'
  
  const aiState = getMutableAIState<typeof AI>()
  
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })
  
  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode
  
  const ui = render({
    model: 'gpt-3.5-turbo',
    provider: openai,
    initial: <SpinnerMessage/>,
    messages: [
      {
        role: 'system',
        content: `\
You are a language teacher bot and you can help users learn any language they want.
You and the user can discuss language rules and you can correct and explain their mistakes.
The user can request to do an exercise.

Messages inside [] means that it's a UI element or a user event. For example:
- "[Current answer = ["Ik", "heb", "broer"]]" means that an interface of the exercise is shown to the user and their current answer is "Ik heb broer".

If the user requests to do an exercise, call \`vocabulary_exercise\` to show the exercise UI.
Besides that, you can also chat with users if needed.`
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({content, done, delta}) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value}/>
      }
      
      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }
      
      return textNode
    },
    functions: {
      
      vocabularyExercise: {
        description:
          'Show sentence to be translated and the UI for the exercise. Use this if the user wants to do an exercise',
        parameters: z.object({
          language: z
            .string()
            .describe(
              'The language user wants to learn e. g. dutch, ukrainian'
            ),
          level:z.string().describe('Level of knowledge of the language that user wants to practice or learn. If the user did not specify it, generate +- B2 sentence. '),
          sentence: z.string().describe('The sentence in English that you come up with based on level of language knowledge of the user'),
          translated: z
            .string()
            .describe(
              'The translated sentence you generated. '
            )
        }),
        render: async function* ({language, sentence, translated}) {
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showStockPurchase',
                content: JSON.stringify({
                  language,
                  sentence,
                  translated
                })
              }
            ]
          })
          
          return (
            <BotCard>
              <Purchase
                props={{
                  language,
                  sentence,
                  translated,
                  status: 'requires_action'
                }}
              />
            </BotCard>
          )
        }
      },
    }
  })
  
  return {
    id: nanoid(),
    display: ui
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: {chatId: nanoid(), messages: []},
  unstable_onGetUIState: async () => {
    'use server'
    
    const session = await auth()
    
    if (session && session.user) {
      const aiState = getAIState()
      
      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({state, done}) => {
    'use server'
    
    const session = await auth()
    
    if (session && session.user) {
      const {chatId, messages} = state
      
      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)
      
      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }
      
      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'listStocks' ? (
            <BotCard>
              <Stocks props={JSON.parse(message.content)}/>
            </BotCard>
          ) : message.name === 'showStockPrice' ? (
            <BotCard>
              <Stock props={JSON.parse(message.content)}/>
            </BotCard>
          ) : message.name === 'showStockPurchase' ? (
            <BotCard>
              <Purchase props={JSON.parse(message.content)}/>
            </BotCard>
          ) : message.name === 'getEvents' ? (
            <BotCard>
              <Events props={JSON.parse(message.content)}/>
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content}/>
        )
    }))
}

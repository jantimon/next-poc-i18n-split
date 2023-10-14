import { ClientDemo } from '../client'
import { ClientDemo2 } from './client2'
import { Hybrid } from './hybrid'

export default function Home() {
  return (
    <main>
     <ClientDemo2 />
     <ClientDemo />
     <Hybrid />
    </main>
  )
}

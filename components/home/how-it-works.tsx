import { CheckCircle } from "lucide-react"

const steps = [
  "Create a new session for your coding project",
  "Share updates as you code, including snippets and explanations",
  "Build in public, and get feedback from the community",
  "Complete your project and showcase the final result",
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center space-x-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-lg">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

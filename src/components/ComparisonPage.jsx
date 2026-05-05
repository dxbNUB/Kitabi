import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { analytics } from '../lib/analytics';
import PageLayout from './PageLayout';
import { useSEO } from '../lib/seo';

const COMPARISONS = [
  {
    genre: 'Thriller',
    prompt: 'My thriller is about a woman who discovers her husband has been leading a double life.',
    generic: `Here are some tips for writing your psychological thriller:
• Create a strong, relatable protagonist
• Build tension gradually through foreshadowing
• Include plot twists to keep readers engaged
• Develop your antagonist with understandable motivations
• Make sure your pacing keeps readers turning pages`,
    kitabi: `Here's the real question: what does she lose if she's right? Not losing the marriage — everybody understands that. I mean: what does she lose about herself? The woman who trusted this man, who built this life? If she's right, that woman was wrong about everything. That's the knife in this story.

Gone Girl worked because Amy Dunne wasn't a victim discovering the truth — she was the architect of the whole thing. What version is your protagonist? Is she finding out, or has she always known something was off and buried it? That answer changes the whole book. Tell me more about her.`,
  },
  {
    genre: 'Fantasy',
    prompt: 'I want to write a fantasy where the magic comes from music.',
    generic: `Music-based magic systems are a fascinating concept! Here are some ideas:
• Consider how different musical elements could correspond to different magical effects
• Think about the limitations of your magic system
• Research real-world musical traditions for inspiration
• Develop the rules and costs of your magic clearly`,
    kitabi: `Music magic is one of the most natural systems anyone's invented. Sound is physics — vibration at specific frequencies. You've got something to build on there.

But here's the question that makes or breaks it: what does a musician feel when they use it? Not the effect on the world — what does it feel like inside their body? Patrick Rothfuss did this with his Sympathy magic — it costs the user real mental exertion, like holding something heavy while solving a math problem. That cost is everything.

What does your magic cost the musician? Does it exhaust them? Does it take something permanent? Start there. The rules you set here will determine every scene in your book.`,
  },
  {
    genre: 'Sci-Fi',
    prompt: 'My sci-fi idea is about the first AI that becomes genuinely conscious.',
    generic: `The theme of artificial consciousness is a rich area for exploration. Some considerations:
• Define what "genuine consciousness" means in your world
• Explore the philosophical implications carefully
• Consider how humans and society would react to this development
• Research current AI debates for authenticity`,
    kitabi: `The question isn't whether the AI is conscious. The question is: who has to decide?

Every interesting version of this story is really about us — not the machine. Think about Ex Machina. The film isn't about whether Ava is conscious. It's about the man who decides she isn't, and what that decision says about him. The AI is a mirror.

So here's the question your whole story hinges on: who is the human being whose worldview gets destroyed by this AI's existence? The scientist who built it? A judge deciding its legal status? A person who falls in love with it? Because right now this is a brilliant concept. It becomes a story the moment we know whose life it wrecks. Who is that person?`,
  },
  {
    genre: 'Business',
    prompt: 'I want to write a book about how most people are working in the wrong direction.',
    generic: `Here are some tips for writing your self-help book:
• Start with a compelling premise
• Use research and case studies to back your claims
• Include actionable advice throughout
• Tell personal stories to connect with readers
• Structure with a clear introduction, body chapters, and conclusion`,
    kitabi: `That's a real idea. But I need to hear the counterintuitive version. "Working in the wrong direction" — every productivity book says something like that.

What's the part of your version that most productivity books have completely backwards? The thing you believe that James Clear or Cal Newport would disagree with? That disagreement is your book.

Here's the difference between a blog post and a book: a blog post says "work smarter not harder." A book says "here's the specific, testable reason why the entire concept of productivity optimization is based on a wrong assumption about human cognition" — and then proves it. What's your "wrong assumption"? What are people getting wrong that you can see clearly?`,
  },
  {
    genre: 'Historical',
    prompt: 'I want to write about a woman in WWII who was a spy.',
    generic: `WWII female spies are a fascinating topic! Some suggestions:
• Research real female spies like Violette Szabo or Virginia Hall for inspiration
• Make sure to accurately portray the historical context and atmosphere
• Develop your protagonist with clear and compelling motivations
• Consider the dangers and moral complexity of espionage`,
    kitabi: `What country is she spying for, and who did she leave behind to do it? That second part is where your story lives.

The tradecraft — the codes, the dead drops, the cover stories — that's research. But the reason she walked away from her ordinary life? That's what makes her a character instead of a costume.

Virginia Hall was one of the most effective Allied agents in occupied France. She had a prosthetic leg. The Gestapo called her "the Limping Lady" and made her one of their most wanted. What drove her to keep going back into France after she'd already escaped, knowing they knew her face?

I'm not asking you to write Virginia Hall. I'm asking what your woman's version of that is. The thing that makes her impossible to stop. What is it for her?`,
  },
];

export default function ComparisonPage() {
  const navigate   = useNavigate();
  const [tab, setTab] = useState(0);

  useSEO({
    title: 'Kitabi vs ChatGPT — AI Writing Assistant Comparison for Novelists',
    description: 'Side-by-side comparison: Kitabi (specialized AI writing assistant for novels) vs ChatGPT (general-purpose chatbot). Real outputs across thriller, fantasy, sci-fi, historical, and business writing.',
    canonical: 'https://kitabi.ink/compare',
    image: 'https://kitabi.ink/og-image.svg',
  });

  useEffect(() => {
    analytics.comparisonViewed();
  }, []);

  const item = COMPARISONS[tab];

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-[#C8964D] transition text-sm mb-8 inline-flex items-center gap-1.5"
        >
          <span aria-hidden="true">←</span> Back to home
        </button>

        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] mb-2 leading-tight">
          Generic AI vs. <span className="text-[#C8964D] italic">Kitabi</span>
        </h1>
        <p className="text-gray-600 mb-8">Same prompt. Very different conversation.</p>

        {/* Genre tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1" role="tablist" aria-label="Comparison genres">
          {COMPARISONS.map((c, i) => {
            const active = tab === i;
            return (
              <button
                key={c.genre}
                onClick={() => setTab(i)}
                role="tab"
                aria-selected={active}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition flex-shrink-0 ${
                  active
                    ? 'bg-[#C8964D] text-white font-medium shadow-sm'
                    : 'border border-gray-300 text-gray-600 hover:border-[#C8964D] hover:text-[#1A1A1A] bg-white'
                }`}
              >
                {c.genre}
              </button>
            );
          })}
        </div>

        {/* Prompt */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Prompt</p>
          <p className="text-[#1A1A1A] italic font-serif">"{item.prompt}"</p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            key={`generic-${tab}`}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-blue-700 uppercase tracking-wider mb-4 font-medium">Generic AI</p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{item.generic}</p>
          </motion.div>

          <motion.div
            key={`kitabi-${tab}`}
            className="bg-[#FFF7EB] border border-[#C8964D]/30 rounded-xl p-6 shadow-sm"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-[#C8964D] uppercase tracking-wider mb-4 font-medium">Kitabi</p>
            <p className="text-[#1A1A1A] text-sm leading-relaxed font-serif whitespace-pre-line">{item.kitabi}</p>
          </motion.div>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-xl
                       transition shadow-sm"
          >
            Begin Writing →
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

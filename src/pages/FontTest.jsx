/**
 * Font rendering test page — internal QA, not part of the public site.
 * Visit /font-test to verify lowercase 't' (and other glyphs) render correctly
 * across all our font stacks: Inter (sans), Playfair Display (serif),
 * Cormorant Garamond (display), Reem Kufi (arabic).
 *
 * If the lowercase 't' looks like 'l' or '|' (no horizontal crossbar), the
 * font isn't loading — check the browser network tab for a failed Google
 * Fonts request, or hard-refresh to bust cache.
 */
export default function FontTest() {
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] p-12 max-w-4xl mx-auto">
      <h1 className="font-serif text-4xl font-bold mb-2">Font rendering test</h1>
      <p className="text-gray-600 mb-12">
        Every lowercase <span className="font-mono bg-gray-100 px-1.5 rounded">t</span> below should
        have a clear horizontal crossbar. If any look like <span className="font-mono bg-gray-100 px-1.5 rounded">l</span> or
        <span className="font-mono bg-gray-100 px-1.5 rounded"> | </span>, the font failed to load.
      </p>

      <Section title="Sans-serif (Inter)">
        <p className="text-2xl font-sans mb-4">
          The quick brown fox jumps over the lazy dog
        </p>
        <p className="text-2xl font-sans mb-4">
          tttt TTTT — The cat sat on the mat
        </p>
        <p className="text-base font-sans mb-2 text-gray-600">Lowercase</p>
        <p className="text-xl font-sans mb-4">
          a b c d e f g h i j k l m n o p q r s t u v w x y z
        </p>
        <p className="text-base font-sans mb-2 text-gray-600">Uppercase</p>
        <p className="text-xl font-sans">
          A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
        </p>
      </Section>

      <Section title="Serif (Playfair Display) — chapter reading font">
        <p className="text-2xl font-serif mb-4">
          The quick brown fox jumps over the lazy dog
        </p>
        <p className="text-2xl font-serif mb-4">
          tttt TTTT — The cat sat on the mat
        </p>
        <p className="text-xl font-serif">
          a b c d e f g h i j k l m n o p q r s t u v w x y z
        </p>
      </Section>

      <Section title="Display (Cormorant Garamond) — kitabi wordmark">
        <p className="text-3xl font-display mb-4">kitabi</p>
        <p className="text-2xl font-display mb-4">
          The quick brown fox jumps over the lazy dog
        </p>
        <p className="text-2xl font-display">
          tttt TTTT — Tonight, theater, theory, throat
        </p>
      </Section>

      <Section title="Arabic (Reem Kufi)">
        <p className="text-3xl font-arabic mb-4" dir="rtl">كتابي · فكرتك بين يديك</p>
        <p className="text-xl font-arabic" dir="rtl">
          الحروف العربية: ا ب ت ث ج ح خ د ذ ر ز س ش ص ض
        </p>
      </Section>

      <Section title="Sample chapter text (the most important place to verify)">
        <article className="font-serif text-lg leading-[1.85] text-[#2C2416] space-y-4">
          <p>
            Theodore tucked the letter into his coat pocket. The trains were
            late tonight, and the platform was nearly empty. He thought about
            the things he hadn't said. The things he never would.
          </p>
          <p>"Tickets, please," the conductor said.</p>
          <p>
            That was when he started to notice. The cat on the mat. The hat
            that had tilted. The thunder that hadn't come. Theodore tightened
            the knot at his throat and stepped onto the train.
          </p>
        </article>
      </Section>

      <Section title="Weights — the typed text">
        <p className="text-xl font-light    mb-1.5">Light · the typed text</p>
        <p className="text-xl font-normal   mb-1.5">Normal · the typed text</p>
        <p className="text-xl font-medium   mb-1.5">Medium · the typed text</p>
        <p className="text-xl font-semibold mb-1.5">Semibold · the typed text</p>
        <p className="text-xl font-bold     mb-1.5">Bold · the typed text</p>
        <p className="text-xl font-extrabold">Extrabold · the typed text</p>
      </Section>

      <Section title="Critical words (the most-common failure cases)">
        <ul className="space-y-1.5 text-2xl font-serif">
          {['the', 'that', 'started', 'writing', 'Kitabi', 'letter', 'tonight', 'tomorrow', 'think', 'truth'].map((w) => (
            <li key={w} className="font-serif">{w}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-12 pb-10 border-b border-gray-200 last:border-0">
      <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-5">{title}</h2>
      {children}
    </section>
  );
}

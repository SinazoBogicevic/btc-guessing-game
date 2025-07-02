import styles from "./RuleCard.module.css";

interface RuleCardProps {
  onClose: () => void;
}

const rules = [
  "Guesses are resolved at least after 60s have passed.",
  "The BTC price must change before your guess can be resolved.",
  "If you're right, you gain 1 point. If you're wrong, you lose 1.",
  "You can only make one guess at a time.",
  "The game auto-resolves once conditions are met!",
];

export default function RuleCard({ onClose }: RuleCardProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h1 className={styles.title}>How to play</h1>
        <ul className={styles.list}>
          {rules.map((rule, i) => (
            <li key={i} className={styles.listItem}>
              {rule}
            </li>
          ))}
        </ul>
        <button onClick={onClose} className={styles.button}>
          Got it!
        </button>
      </div>
    </div>
  );
}

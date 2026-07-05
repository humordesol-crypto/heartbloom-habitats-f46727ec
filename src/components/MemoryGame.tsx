import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, RotateCcw } from "lucide-react";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onWin: (coins: number, xp: number, score: number) => void;
  bestScore: number;
}

const ICONS = ["🍓", "🍭", "🌈", "⭐", "🎈", "🦄", "🍰", "🌸"];

interface Card {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
}

function makeDeck(): Card[] {
  const pairs = [...ICONS, ...ICONS];
  return pairs
    .map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5)
    .map((c, i) => ({ ...c, id: i }));
}

export function MemoryGame({ open, onClose, onWin, bestScore }: Props) {
  const [deck, setDeck] = useState<Card[]>(makeDeck);
  const [pick, setPick] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const allMatched = useMemo(() => deck.every((c) => c.matched), [deck]);

  useEffect(() => {
    if (open) {
      setDeck(makeDeck());
      setPick([]);
      setMoves(0);
      setWon(false);
    }
  }, [open]);

  useEffect(() => {
    if (allMatched && !won && deck.length > 0) {
      setWon(true);
      const score = Math.max(10, 100 - moves * 4);
      const coins = 20 + Math.max(0, 40 - moves * 2);
      const xp = 15;
      setTimeout(() => onWin(coins, xp, score), 400);
    }
  }, [allMatched, won, moves, deck.length, onWin]);

  const flip = (idx: number) => {
    if (locked) return;
    const card = deck[idx];
    if (card.flipped || card.matched) return;
    const next = deck.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    const nextPick = [...pick, idx];
    setDeck(next);
    setPick(nextPick);

    if (nextPick.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextPick;
      if (next[a].icon === next[b].icon) {
        setTimeout(() => {
          setDeck((d) =>
            d.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c))
          );
          setPick([]);
        }, 400);
      } else {
        setLocked(true);
        setTimeout(() => {
          setDeck((d) =>
            d.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c))
          );
          setPick([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  const restart = () => {
    setDeck(makeDeck());
    setPick([]);
    setMoves(0);
    setWon(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Jogo da Memória">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-muted-foreground">
          Jogadas: <span className="text-foreground">{moves}</span>
          <span className="mx-2">·</span>
          Recorde: <span className="text-foreground">{bestScore}</span>
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-muted"
        >
          <RotateCcw className="h-3 w-3" /> Reiniciar
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {deck.map((card, idx) => (
          <motion.button
            key={card.id}
            onClick={() => flip(idx)}
            whileTap={{ scale: 0.94 }}
            className="aspect-square relative"
            style={{ perspective: 800 }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.8_0.18_330)] shadow-soft grid place-items-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <Sparkles className="h-6 w-6 text-white/80" />
              </div>
              <div
                className={`absolute inset-0 rounded-2xl bg-white text-4xl grid place-items-center shadow-soft border-2 ${
                  card.matched ? "border-[oklch(0.75_0.15_150)]" : "border-white"
                }`}
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                {card.icon}
              </div>
            </motion.div>
          </motion.button>
        ))}
      </div>

      {won && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl bg-gradient-to-r from-primary to-[oklch(0.82_0.16_50)] text-white p-4 text-center"
        >
          <div className="text-2xl">🎉</div>
          <div className="font-bold">Ganhou!</div>
          <div className="text-xs opacity-90">Recompensa entregue ao Momo</div>
        </motion.div>
      )}
    </Modal>
  );
}

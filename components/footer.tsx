export function Footer() {
  return (
    <footer className="border-t border-border bg-card/90 wood-grain mt-12">
      <div className="container mx-auto px-6 py-8 text-center">
        <div className="space-y-3">
          <p className="text-sm text-foreground/80">
            <strong className="text-foreground font-semibold">Fővédnök:</strong> Horváth András T. úr (@fizik.ha)
          </p>
          <p className="text-sm text-foreground/80">
            Az oldalt készítette: <strong className="text-foreground font-semibold">Balla Botond</strong>, 23F
          </p>
          <p className="text-sm text-foreground/90 font-semibold pt-2">
            Kőbányai Szent László Gimnázium
          </p>
        </div>
      </div>
    </footer>
  );
}

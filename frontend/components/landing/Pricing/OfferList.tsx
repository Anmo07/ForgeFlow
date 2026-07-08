import { CheckCircle2, XCircle } from "lucide-react";

const OfferList = ({
  text,
  status,
}: {
  text: string;
  status: "active" | "inactive";
}) => {
  return (
    <div className="mb-3 flex items-center gap-3">
      {status === "active" ? (
        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-4.5 w-4.5 shrink-0 text-muted-foreground/40" />
      )}
      <p className={`text-sm font-medium ${status === "active" ? "text-foreground/80" : "text-muted-foreground/50"}`}>
        {text}
      </p>
    </div>
  );
};

export default OfferList;

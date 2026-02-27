import { usePriceStatus } from '../../usePriceStatus';

export default function PriceStatus() {
  const isStale = usePriceStatus();

  if (!isStale) return null;

  return (
    <div className="stale-warning">
      ⚠ Чтобы получить свежий прайс — подключитесь к интернету
    </div>
  );
}
import { usePriceStatus } from '../../usePriceStatus';
import './style.scss';

export default function PriceStatus() {
  const updatedAtText = usePriceStatus();

  if (!updatedAtText) return null;

  return (
    <div className="price-status">
      Обновлено: {updatedAtText}
    </div>
  );
}

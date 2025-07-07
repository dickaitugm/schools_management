// Quick test for dateUtils import
import { formatDateIndonesian, formatDateTimeIndonesian } from '../utils/dateUtils';

console.log('Testing import:', formatDateIndonesian('2024-01-15'));
console.log('Testing datetime:', formatDateTimeIndonesian('2024-01-15', '09:30:00'));

export default function TestDateUtils() {
  return <div>Date Utils Test</div>;
}

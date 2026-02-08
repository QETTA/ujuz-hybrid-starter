/**
 * NetworkError - iOS 26 Style
 *
 * Network error specific component
 */

import ErrorView from './ErrorView.ios26';
import { COPY } from '@/app/copy/copy.ko';

interface NetworkErrorProps {
  onRetry?: () => void;
}

export default function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorView
      icon="cloud-offline-outline"
      title={COPY.NETWORK_OFFLINE}
      message={COPY.NETWORK_ERROR_MSG}
      onRetry={onRetry}
    />
  );
}

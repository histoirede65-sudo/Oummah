import { Image, type ImageContentFit, type ImageLoadEventData } from 'expo-image';
import { memo, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  uri?: string;
  barcode?: string;
  brand?: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  qualityCheck?: (source: ImageLoadEventData['source']) => boolean;
  onImageError?: () => void;
};

export const BoycottProductImage = memo(function BoycottProductImage({ uri, barcode, brand, style, contentFit = 'cover', qualityCheck, onImageError }: Props) {
  const [failedUri, setFailedUri] = useState<string | undefined>();
  const [rejectedUri, setRejectedUri] = useState<string | undefined>();
  const [acceptedUri, setAcceptedUri] = useState<string | undefined>();
  const canRenderImage = Boolean(uri) && failedUri !== uri && rejectedUri !== uri;
  // With a quality check, keep the image invisible until it passed, so a rejected photo never flashes.
  const isVisible = !qualityCheck || acceptedUri === uri;

  useEffect(() => {
    if (__DEV__) console.log('[ProductImageComponentDiagnostic]', { mounted: true, barcode, brand, initialImageUrl: uri });
  }, [barcode, brand, uri]);

  useEffect(() => {
    setFailedUri(undefined);
    setRejectedUri(undefined);
  }, [uri]);

  return (
    <View style={[styles.frame, style]}>
      <View pointerEvents="none" style={styles.placeholder}>
        <Ionicons name="image-outline" size={25} color={colors.goldLight} />
      </View>
      {canRenderImage ? (
        <Image
          cachePolicy="memory-disk"
          contentFit={contentFit}
          onError={(event) => {
            if (__DEV__) console.log('[ProductImageRenderDiagnostic]', { barcode, step: 'error', imageUrl: uri, error: event?.error });
            setFailedUri(uri);
            onImageError?.();
          }}
          source={uri}
          style={[StyleSheet.absoluteFill, !isVisible && styles.hidden]}
          onLoad={(event) => {
            if (__DEV__) console.log('[ProductImageRenderDiagnostic]', { barcode, step: 'loaded', imageUrl: uri });
            if (!qualityCheck) return;
            if (qualityCheck(event.source)) setAcceptedUri(uri);
            else setRejectedUri(uri);
          }}
          transition={qualityCheck ? 0 : 150}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  hidden: {
    opacity: 0,
  },
});

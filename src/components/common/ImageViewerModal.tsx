import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Product } from '../../types/domain.types';

interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export const ImageViewerModal = ({ isOpen, onClose, product }: ImageViewerModalProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
        }
    }, [isOpen, product]);

    if (!product) return null;

    // Get images array - use images if available, otherwise create array from single image
    const images = product.images && product.images.length > 0
        ? product.images
        : product.image
            ? [product.image, product.image, product.image, product.image]
            : [];

    const currentImage = images[selectedIndex] || '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product.description} size="medium">
            <div className="image-viewer-modal">
                <div className="image-viewer-main">
                    {currentImage ? (
                        <img src={currentImage} alt={`${product.description} - Image ${selectedIndex + 1}`} />
                    ) : (
                        <span>No image available</span>
                    )}
                </div>
                <div className="image-viewer-thumbnails">
                    {[0, 1, 2, 3].map((index) => (
                        <button
                            key={index}
                            className={`image-thumbnail-btn ${selectedIndex === index ? 'active' : ''}`}
                            onClick={() => setSelectedIndex(index)}
                            aria-label={`View image ${index + 1}`}
                        >
                            {images[index] ? (
                                <img src={images[index]} alt={`Thumbnail ${index + 1}`} />
                            ) : (
                                index + 1
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

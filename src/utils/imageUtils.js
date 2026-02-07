/**
 * Get image path with automatic format detection
 * Tries multiple image formats: png, jpg, jpeg, webp
 * @param {string} basePath - Base path without extension (e.g., '/PNG/Shotgun')
 * @returns {string} - Path with extension
 */
export function getImagePath(basePath) {
    // Remove extension if provided
    const pathWithoutExt = basePath.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '')

    // Try formats in order of preference
    const formats = ['png', 'jpg', 'jpeg', 'webp', 'gif']

    // For now, return with .png as default
    // The actual format detection will happen via onError in the component
    return `${pathWithoutExt}.png`
}

/**
 * Try loading image with multiple format fallbacks
 * @param {string} basePath - Base path without extension
 * @param {function} onSuccess - Callback when image loads successfully
 * @param {function} onError - Callback when all formats fail
 */
export function tryLoadImage(basePath, onSuccess, onError) {
    const pathWithoutExt = basePath.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '')
    const formats = ['png', 'jpg', 'jpeg', 'webp', 'gif']

    let currentIndex = 0

    const tryNext = () => {
        if (currentIndex >= formats.length) {
            // All formats failed
            if (onError) onError()
            return
        }

        const img = new Image()
        const currentPath = `${pathWithoutExt}.${formats[currentIndex]}`

        img.onload = () => {
            if (onSuccess) onSuccess(currentPath)
        }

        img.onerror = () => {
            currentIndex++
            tryNext()
        }

        img.src = currentPath
    }

    tryNext()
}

/**
 * React hook for loading images with format fallback
 * @param {string} basePath - Base path without extension
 * @returns {object} - { imagePath, isLoading, error }
 */
export function useImageWithFallback(basePath) {
    const [imagePath, setImagePath] = React.useState(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState(false)

    React.useEffect(() => {
        setIsLoading(true)
        setError(false)

        tryLoadImage(
            basePath,
            (successPath) => {
                setImagePath(successPath)
                setIsLoading(false)
            },
            () => {
                setError(true)
                setIsLoading(false)
            }
        )
    }, [basePath])

    return { imagePath, isLoading, error }
}

/**
 * 計算兩點間的 Haversine 距離 (公尺)
 */
export function haversineDistance(p1, p2) {
    const R = 6371000 // 地球半徑 (m)
    const φ1 = p1.lat * Math.PI / 180
    const φ2 = p2.lat * Math.PI / 180
    const Δφ = (p2.lat - p1.lat) * Math.PI / 180
    const Δλ = (p2.lng - p1.lng) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

/**
 * 從 point 向 towardPoint 方向偏移指定距離
 */
export function offsetPointInward(point, towardPoint, distanceMeters) {
    const totalDist = haversineDistance(point, towardPoint)
    const ratio = distanceMeters / totalDist

    return {
        lat: point.lat + (towardPoint.lat - point.lat) * ratio,
        lng: point.lng + (towardPoint.lng - point.lng) * ratio
    }
}

/**
 * 建立 40m × 40m 方形區塊的 bounds
 */
export function createZoneBounds(center, sizeMeters = 40) {
    const latOffset = sizeMeters / 2 / 111320
    const lngOffset = sizeMeters / 2 / (111320 * Math.cos(center.lat * Math.PI / 180))

    return [
        [center.lat - latOffset, center.lng - lngOffset], // SW
        [center.lat + latOffset, center.lng + lngOffset]  // NE
    ]
}

/**
 * 從中心點建立重生區塊
 */
export function createSpawnZoneFromPoint(center, color, label) {
    return {
        bounds: createZoneBounds(center),
        center: center,
        color: color,
        label: label
    }
}

/**
 * 圓形邊界：隨機生成重生區塊（每回合不同）
 */
export function generateRandomSpawnZones(boundaryRadius, centerPosition) {
    // 隨機選擇一個角度（0-360度）
    const randomAngle = Math.random() * 360
    const angleRad = randomAngle * Math.PI / 180

    // 計算直徑兩端的點
    const latOffset = boundaryRadius / 111320
    const lngOffset = boundaryRadius / (111320 * Math.cos(centerPosition.lat * Math.PI / 180))

    const pointA = {
        lat: centerPosition.lat + latOffset * Math.cos(angleRad),
        lng: centerPosition.lng + lngOffset * Math.sin(angleRad)
    }

    const pointB = {
        lat: centerPosition.lat - latOffset * Math.cos(angleRad),
        lng: centerPosition.lng - lngOffset * Math.sin(angleRad)
    }

    // 向內偏移 30m
    const blueCenter = offsetPointInward(pointA, pointB, 30)
    const redCenter = offsetPointInward(pointB, pointA, 30)

    return {
        blueZone: createSpawnZoneFromPoint(blueCenter, '#3498db', '藍方重生點'),
        redZone: createSpawnZoneFromPoint(redCenter, '#e74c3c', '紅方重生點')
    }
}

/**
 * 檢查點是否在多邊形內（Ray casting algorithm）
 */
function isPointInPolygon(point, polygon) {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        // polygon 格式: [lat, lng]
        const xi = polygon[i][1], yi = polygon[i][0]  // xi = lng, yi = lat
        const xj = polygon[j][1], yj = polygon[j][0]  // xj = lng, yj = lat

        // point 格式: { lat, lng }
        const intersect = ((yi > point.lat) !== (yj > point.lat))
            && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }
    return inside
}

/**
 * 驗證重生點（40m×40m 區域）是否完全在邊界內
 */
export function validateSpawnPointInBoundary(spawnCenter, boundaryPoints, boundaryRadius, centerPosition) {
    const zoneSize = 40 // 40m × 40m
    const corners = createZoneBounds(spawnCenter, zoneSize)

    // 建立四個角點
    const cornerPoints = [
        { lat: corners[0][0], lng: corners[0][1] }, // SW
        { lat: corners[0][0], lng: corners[1][1] }, // SE
        { lat: corners[1][0], lng: corners[0][1] }, // NW
        { lat: corners[1][0], lng: corners[1][1] }  // NE
    ]

    if (boundaryPoints && boundaryPoints.length >= 3) {
        // 多邊形邊界：檢查所有角點是否都在多邊形內
        return cornerPoints.every(corner => isPointInPolygon(corner, boundaryPoints))
    } else if (boundaryRadius && centerPosition) {
        // 圓形邊界：檢查所有角點距離中心是否都 <= 半徑
        return cornerPoints.every(corner => {
            const dist = haversineDistance(corner, centerPosition)
            return dist <= boundaryRadius
        })
    }

    return false
}

/**
 * 多邊形邊界：計算固定重生區塊（最長邊）
 * 注意：此函數僅用於多邊形邊界，圓形邊界請使用 generateRandomSpawnZones
 */
export function calculateSpawnZones(boundaryPoints) {
    if (!boundaryPoints || boundaryPoints.length < 2) {
        throw new Error('需要至少 2 個邊界點')
    }

    // 找最遠兩點
    let maxDist = 0
    let pointA, pointB

    for (let i = 0; i < boundaryPoints.length; i++) {
        for (let j = i + 1; j < boundaryPoints.length; j++) {
            const p1 = { lat: boundaryPoints[i][0], lng: boundaryPoints[i][1] }
            const p2 = { lat: boundaryPoints[j][0], lng: boundaryPoints[j][1] }
            const dist = haversineDistance(p1, p2)

            if (dist > maxDist) {
                maxDist = dist
                pointA = p1
                pointB = p2
            }
        }
    }

    // 向內偏移 30m
    const blueCenter = offsetPointInward(pointA, pointB, 30)
    const redCenter = offsetPointInward(pointB, pointA, 30)

    return {
        blueZone: createSpawnZoneFromPoint(blueCenter, '#3498db', '藍方重生點'),
        redZone: createSpawnZoneFromPoint(redCenter, '#e74c3c', '紅方重生點')
    }
}

/**
 * 檢查兩個重生點區域是否重疊
 */
export function checkSpawnZonesOverlap(point1, point2, zoneSize = 40) {
    // 計算兩個重生點的邊界
    const bounds1 = createZoneBounds(point1, zoneSize)
    const bounds2 = createZoneBounds(point2, zoneSize)

    // 檢查矩形是否重疊
    // 如果一個矩形完全在另一個矩形的左邊、右邊、上邊或下邊，則不重疊
    const noOverlap =
        bounds1[1][0] < bounds2[0][0] || // rect1 在 rect2 上方
        bounds1[0][0] > bounds2[1][0] || // rect1 在 rect2 下方
        bounds1[1][1] < bounds2[0][1] || // rect1 在 rect2 左邊
        bounds1[0][1] > bounds2[1][1]    // rect1 在 rect2 右邊

    return !noOverlap
}

/**
 * 檢查點是否在重生區域內
 */
export function isPointInSpawnZone(point, spawnCenter, zoneSize = 40) {
    const bounds = createZoneBounds(spawnCenter, zoneSize)

    return point.lat >= bounds[0][0] &&
        point.lat <= bounds[1][0] &&
        point.lng >= bounds[0][1] &&
        point.lng <= bounds[1][1]
}

/**
 * 從自訂重生點建立區塊
 */
export function createSpawnZonesFromCustomPoints(spawnPoints) {
    if (!spawnPoints || spawnPoints.length !== 2) {
        throw new Error('需要提供 2 個重生點')
    }

    return {
        blueZone: createSpawnZoneFromPoint(spawnPoints[0], '#3498db', '藍方重生點'),
        redZone: createSpawnZoneFromPoint(spawnPoints[1], '#e74c3c', '紅方重生點')
    }
}

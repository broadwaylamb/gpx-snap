import {DOMParser} from "xmldom";
import {PathOrFileDescriptor, readFileSync, writeFileSync} from "fs";
import {gpx} from "togeojson";
import togpx from "togpx";
import {Feature, FeatureCollection, GeoJsonProperties, Point, Position} from "geojson";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import {distance, lineString, point} from "turf";
import length from "@turf/length";
import assert from "assert";

function readGpxAndConvertToGeoJson(path: PathOrFileDescriptor) {
    return gpx(new DOMParser().parseFromString(readFileSync(path, 'utf-8')));
}

const trackWithTimestamps = readGpxAndConvertToGeoJson(process.argv[2]);
const trackToSnapTo = readGpxAndConvertToGeoJson(process.argv[3]);

function coordinates(geoJson: FeatureCollection): Position[] {
    const geometry = geoJson.features[0].geometry;
    switch (geometry.type) {
        case 'LineString':
            return geometry.coordinates;
        case 'MultiLineString':
            return geometry.coordinates.flat();
        default:
            throw new Error('Unsupported geometry type');
    }
}

function properties(geoJson: FeatureCollection): GeoJsonProperties {
    return geoJson.features[0].properties;
}

const trackWithTimeStampsCoords = coordinates(trackWithTimestamps);
const trackToSnapToCoords = coordinates(trackToSnapTo);

function coordTimes(geoJson: FeatureCollection): number[] {
    return (properties(geoJson)?.coordTimes ?? []).flat().map(Date.parse);
}

const timestamps = coordTimes(trackWithTimestamps);
assert(timestamps.length == trackWithTimeStampsCoords.length);

const lineStringToSnapTo = lineString(trackToSnapToCoords);
const projectedPoints = trackWithTimeStampsCoords.map(function (position, i) {
    const projected = nearestPointOnLine(lineStringToSnapTo, position);
    projected.properties.coordTimeNumber = timestamps[i];
    return projected;
});

const newTrackPoints: Feature<Point>[] = [];
for (let i = 0, j = 0, startedAndHasNotEnded = false; i < trackToSnapToCoords.length; ++i) {
    const existingPoint = trackToSnapToCoords[i];
    if (startedAndHasNotEnded) {
        newTrackPoints.push(point(existingPoint, {}));
    }
    for (; j < projectedPoints.length && projectedPoints[j].properties.index! <= i; ++j) {
        startedAndHasNotEnded = j < projectedPoints.length - 1;
        newTrackPoints.push(projectedPoints[j] as Feature<Point>);
    }
}

assert(newTrackPoints.length > 0, "The resulting track is empty!");
assert(newTrackPoints[0].properties && newTrackPoints[0].properties.coordTimeNumber,
    "The resulting track should start with a point with a timestamp!");

const newTrack = lineString(newTrackPoints.map((feature) => feature.geometry.coordinates), {});

// Interpolate timestamps
for (let i = 1, lastIndexWithTimestamp = 0; i < newTrackPoints.length; ++i) {
    const tp = newTrackPoints[i];
    if (tp.properties && tp.properties.coordTimeNumber) {
        const startTime = newTrackPoints[lastIndexWithTimestamp].properties!.coordTimeNumber;
        const endTime: number = tp.properties.coordTimeNumber;

        const segmentToInterpolate = lineString(newTrack.geometry.coordinates.slice(lastIndexWithTimestamp, i + 1));
        const avgSpeed = length(segmentToInterpolate) / (endTime - startTime);
        for (let j = lastIndexWithTimestamp + 1; j < i; ++j) {
            const timeDelta = distance(newTrackPoints[j - 1], newTrackPoints[j]) / avgSpeed;
            newTrackPoints[j].properties!.coordTimeNumber =
                newTrackPoints[j - 1].properties!.coordTimeNumber + timeDelta;
        }
        lastIndexWithTimestamp = i;
    }
}

newTrack.properties!.coordTimes = newTrackPoints.map((feature) => {
    if (!feature.properties || !feature.properties.coordTimeNumber) return undefined;
    return new Date(feature.properties.coordTimeNumber).toISOString();
});

const resultGpxString = togpx(newTrack, { featureCoordTimes: 'coordTimes' });

writeFileSync('track.gpx', resultGpxString);
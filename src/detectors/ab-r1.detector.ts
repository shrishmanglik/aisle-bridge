import { createDetector } from "./factory";
export const abR1Detector = createDetector("AB-R1", ["tenantBound", "authorityPresent", "sandboxOnly", "readOnly", "digestMatches", "fresh"]);

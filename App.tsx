/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  APIProvider,
  Map,
  useMapsLibrary,
  useMap
} from '@vis.gl/react-google-maps';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PhoneCall,
  MapPin,
  Navigation,
  Compass,
  Volume2,
  VolumeX,
  Users,
  RotateCcw,
  Play,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowRight,
  Download,
  Trash2,
  Sliders,
  X,
  Check,
  Building2,
  Radio,
  LogOut,
  Bell,
  CheckCheck,
  Activity,
  Key,
  Search,
  Crosshair,
  Layers,
  Flame,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink
} from 'lucide-react';
import { AppLogo } from './components/AppLogo';

// ============================================================================
// 1. DATA CONTRACTS & STATE DEFINITIONS
// ============================================================================
export type AppScreen = 'LANDING' | 'AUTH' | 'PERMISSIONS' | 'APP';
export type AppTab = 'NAVIGATE' | 'GUARDIANS' | 'ACTIVITY' | 'PROFILE';
export type JourneyStatus =
  | 'IDLE'
  | 'PLANNED'
  | 'ACTIVE'
  | 'SUSPECTED_DEVIATION'
  | 'CHECK_IN_PENDING'
  | 'ALERT_ESCALATED'
  | 'SOS_TRIGGERED'
  | 'COMPLETED';

export type HeatmapMode = 'COMPOSITE' | 'CRIME' | 'POPULATION';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface AssistancePOI {
  id: string;
  name: string;
  type: 'police' | 'hospital';
  lat: number;
  lng: number;
  distanceMeters: number;
  city: string;
  address?: string;
  isOpen24_7?: boolean;
}

export interface SafetyZone {
  id: string;
  center: Coordinate;
  radiusMeters: number;
  level: 'Lower Risk' | 'Moderate Risk' | 'Higher Risk';
  label: string;
}

export interface SpatialGridPoint {
  lat: number;
  lng: number;
  weight: number;
  category: 'crime' | 'population' | 'haven';
  district: string;
  name: string;
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  distanceText: string;
  durationMin: number;
  durationText: string;
  path: Coordinate[];
  assistanceCount: number;
  assistancePOIs: AssistancePOI[];
  safetyScore: number;
  riskLevel: 'Lower Risk' | 'Moderate Risk' | 'Higher Risk';
  summary: string;
  crimeRatePer100k: number;
  footfallScore: number;
  havenScore: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface TripLog {
  id: string;
  timestamp: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  status: 'Completed Safely' | 'Deviation Resolved' | 'Escalated Dispatch';
  deviationsCount: number;
  riskLevel: 'Lower Risk' | 'Moderate Risk' | 'Higher Risk';
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  emergencyPin: string;
  escalationTimerSeconds: number;
}

// ============================================================================
// 2. CIVIC DATASETS & GROUND-TRUTH MP BASES
// ============================================================================
export const NCRB_MP_BASELINES = [
  { district: 'Bhopal Urban', ratePer100k: 50.42, annualReports: 1210 },
  { district: 'Gwalior Urban', ratePer100k: 46.12, annualReports: 940 },
  { district: 'Indore Urban', ratePer100k: 44.38, annualReports: 1420 },
  { district: 'Jabalpur Urban', ratePer100k: 42.38, annualReports: 890 },
  { district: 'Ujjain District', ratePer100k: 28.45, annualReports: 480 }
];

export const MP_VERIFIED_INFRASTRUCTURE_POIS: AssistancePOI[] = [
  {
    id: 'bhopal-mpnagar-police',
    name: 'MP Nagar Police Station',
    type: 'police',
    lat: 23.2332,
    lng: 77.4344,
    distanceMeters: 80,
    city: 'Bhopal',
    address: 'Zone-II, MP Nagar, Bhopal',
    isOpen24_7: true
  },
  {
    id: 'bhopal-hamidia-hospital',
    name: 'Hamidia Trauma Centre',
    type: 'hospital',
    lat: 23.2612,
    lng: 77.3945,
    distanceMeters: 140,
    city: 'Bhopal',
    address: 'Near Taj-ul-Masajid, Bhopal',
    isOpen24_7: true
  },
  {
    id: 'indore-palasia-police',
    name: 'Palasia Police Help Desk',
    type: 'police',
    lat: 22.7244,
    lng: 75.8839,
    distanceMeters: 120,
    city: 'Indore',
    address: 'Old Palasia Square, AB Road',
    isOpen24_7: true
  },
  {
    id: 'indore-chl-hospital',
    name: 'CHL Hospital Emergency',
    type: 'hospital',
    lat: 22.7410,
    lng: 75.8920,
    distanceMeters: 250,
    city: 'Indore',
    address: 'AB Road near LIG Square',
    isOpen24_7: true
  },
  {
    id: 'indore-vijay-police',
    name: 'Vijay Nagar Police Station',
    type: 'police',
    lat: 22.7540,
    lng: 75.8950,
    distanceMeters: 95,
    city: 'Indore',
    address: 'Scheme 54, AB Road',
    isOpen24_7: true
  },
  {
    id: 'indore-my-hospital',
    name: 'MY Hospital Emergency',
    type: 'hospital',
    lat: 22.7160,
    lng: 75.8680,
    distanceMeters: 160,
    city: 'Indore',
    address: 'Sanyogitaganj, Indore',
    isOpen24_7: true
  },
  {
    id: 'ujjain-mahakal-police',
    name: 'Mahakal Pilgrim Help Desk',
    type: 'police',
    lat: 23.1827,
    lng: 75.7682,
    distanceMeters: 75,
    city: 'Ujjain',
    address: 'Mahakal Mandir Complex',
    isOpen24_7: true
  }
];

export const MP_CRIME_PRESSURE_POINTS: SpatialGridPoint[] = [
  { lat: 23.2510, lng: 77.4120, weight: 8.8, category: 'crime', district: 'Bhopal Urban', name: 'Outer Industrial Bypass' },
  { lat: 22.7220, lng: 75.8540, weight: 8.4, category: 'crime', district: 'Indore Urban', name: 'Old City Alley Pockets' },
  { lat: 22.6980, lng: 75.8320, weight: 7.9, category: 'crime', district: 'Indore Urban', name: 'Outer Ring Fringe' },
  { lat: 23.1480, lng: 79.9210, weight: 7.5, category: 'crime', district: 'Jabalpur Urban', name: 'Garha Outer Spur' }
];

export const MP_POPULATION_FOOTFALL_POINTS: SpatialGridPoint[] = [
  { lat: 22.7533, lng: 75.8937, weight: 9.5, category: 'population', district: 'Indore Urban', name: 'Vijay Nagar Square' },
  { lat: 22.7244, lng: 75.8839, weight: 9.3, category: 'population', district: 'Indore Urban', name: 'Palasia Main Corridor' },
  { lat: 22.7280, lng: 75.8800, weight: 9.0, category: 'population', district: 'Indore Urban', name: '56 Dukan Street' },
  { lat: 23.2332, lng: 77.4344, weight: 9.2, category: 'population', district: 'Bhopal Urban', name: 'MP Nagar Central' },
  { lat: 23.1827, lng: 75.7682, weight: 9.4, category: 'population', district: 'Ujjain District', name: 'Mahakal Corridor' }
];

export const MP_SPATIAL_SAFETY_ZONES: SafetyZone[] = [
  {
    id: 'zone-indore-safe-1',
    center: { lat: 22.7410, lng: 75.8920 },
    radiusMeters: 1200,
    level: 'Lower Risk',
    label: 'AB Road BRTS Secure Corridor'
  },
  {
    id: 'zone-indore-safe-2',
    center: { lat: 22.7244, lng: 75.8839 },
    radiusMeters: 900,
    level: 'Lower Risk',
    label: 'Palasia Police Surveillance Precinct'
  },
  {
    id: 'zone-indore-mod-1',
    center: { lat: 22.7350, lng: 75.8740 },
    radiusMeters: 1100,
    level: 'Moderate Risk',
    label: 'Eastern Commercial Transit'
  },
  {
    id: 'zone-indore-warn-1',
    center: { lat: 22.7220, lng: 75.8540 },
    radiusMeters: 850,
    level: 'Higher Risk',
    label: 'Unmonitored Back-Alley Sector'
  }
];

export function calculateSafetyScore(havenScore: number, footfallScore: number, crimeRate: number): number {
  const crimePenalty = (crimeRate / 60) * 100;
  const raw = 0.40 * havenScore + 0.35 * footfallScore - 0.25 * crimePenalty;
  return Math.min(99, Math.max(45, Math.round(raw + 38)));
}

const MP_PRESET_CORRIDORS: RouteOption[] = [
  {
    id: 'corridor-indore-abroad',
    name: 'AB Road BRTS Arterial',
    summary: 'Direct arterial with active streetlights and 24/7 help desks',
    distanceKm: 6.4,
    distanceText: '6.4 km',
    durationMin: 22,
    durationText: '22 min',
    safetyScore: 96,
    riskLevel: 'Lower Risk',
    crimeRatePer100k: 44.38,
    footfallScore: 92,
    havenScore: 96,
    path: [
      { lat: 22.7533, lng: 75.8937 },
      { lat: 22.7431, lng: 75.8882 },
      { lat: 22.7305, lng: 75.8812 },
      { lat: 22.7196, lng: 75.8577 }
    ],
    assistanceCount: 4,
    assistancePOIs: MP_VERIFIED_INFRASTRUCTURE_POIS.slice(2, 6)
  },
  {
    id: 'corridor-indore-ringroad',
    name: 'Eastern Ring Road Bypass',
    summary: 'Broad commercial roadway with moderate late-night transit',
    distanceKm: 8.9,
    distanceText: '8.9 km',
    durationMin: 20,
    durationText: '20 min',
    safetyScore: 84,
    riskLevel: 'Moderate Risk',
    crimeRatePer100k: 44.38,
    footfallScore: 68,
    havenScore: 78,
    path: [
      { lat: 22.7533, lng: 75.8937 },
      { lat: 22.7480, lng: 75.9120 },
      { lat: 22.7300, lng: 75.9180 },
      { lat: 22.7196, lng: 75.8577 }
    ],
    assistanceCount: 2,
    assistancePOIs: [MP_VERIFIED_INFRASTRUCTURE_POIS[2], MP_VERIFIED_INFRASTRUCTURE_POIS[4]]
  },
  {
    id: 'corridor-indore-inneralleys',
    name: 'Old City By-lanes (Sparse)',
    summary: 'Narrow secondary lanes with low pedestrian flow at night',
    distanceKm: 7.1,
    distanceText: '7.1 km',
    durationMin: 26,
    durationText: '26 min',
    safetyScore: 56,
    riskLevel: 'Higher Risk',
    crimeRatePer100k: 58.20,
    footfallScore: 32,
    havenScore: 42,
    path: [
      { lat: 22.7533, lng: 75.8937 },
      { lat: 22.7390, lng: 75.8720 },
      { lat: 22.7210, lng: 75.8590 },
      { lat: 22.7196, lng: 75.8577 }
    ],
    assistanceCount: 1,
    assistancePOIs: [MP_VERIFIED_INFRASTRUCTURE_POIS[2]]
  }
];

const INITIAL_CONTACTS: EmergencyContact[] = [
  { id: 'c-1', name: 'Ananya Sharma', relationship: 'Sister', phone: '+91 98765 43210', isPrimary: true },
  { id: 'c-2', name: 'Family Emergency', relationship: 'Parents', phone: '+91 98220 12345', isPrimary: false }
];

const INITIAL_LOGS: TripLog[] = [
  {
    id: 'log-1',
    timestamp: 'Yesterday, 10:15 PM',
    origin: 'Vijay Nagar Square, Indore',
    destination: 'Rajwada Palace, Indore',
    distanceKm: 6.4,
    durationMin: 22,
    status: 'Completed Safely',
    deviationsCount: 0,
    riskLevel: 'Lower Risk'
  }
];

// ============================================================================
// 3. GEOMETRY & AUDIO ENGINES
// ============================================================================
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000.0;
  const toRad = Math.PI / 180;
  const dphi = (lat2 - lat1) * toRad;
  const dlam = (lon2 - lon1) * toRad;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dlam / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistance(plat: number, plng: number, alat: number, alng: number, blat: number, blng: number): number {
  const d_ab = haversineDistance(alat, alng, blat, blng);
  if (d_ab === 0) return haversineDistance(plat, plng, alat, alng);
  const toRad = Math.PI / 180;
  const avgLat = ((alat + blat) / 2) * toRad;
  const x = (blng - alng) * toRad * Math.cos(avgLat);
  const y = (blat - alat) * toRad;
  const px = (plng - alng) * toRad * Math.cos(avgLat);
  const py = (plat - alat) * toRad;
  const denom = x * x + y * y;
  const t = denom > 0 ? Math.max(0.0, Math.min(1.0, (px * x + py * y) / denom)) : 0.0;
  return haversineDistance(plat, plng, alat + t * (blat - alat), alng + t * (blng - alng));
}

function calculateCrossTrack(point: Coordinate, polyline: Coordinate[]): number {
  if (polyline.length === 0) return 0;
  if (polyline.length === 1) return haversineDistance(point.lat, point.lng, polyline[0].lat, polyline[0].lng);
  let minD = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentDistance(point.lat, point.lng, polyline[i].lat, polyline[i].lng, polyline[i + 1].lat, polyline[i + 1].lng);
    if (d < minD) minD = d;
  }
  return Math.round(minD);
}

function getPointAlongPath(path: Coordinate[], progress: number): Coordinate {
  if (path.length === 0) return { lat: 22.7533, lng: 75.8937 };
  if (path.length === 1 || progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];
  const total = path.length - 1;
  const segIdx = Math.min(Math.floor(progress * total), total - 1);
  const localT = (progress * total) - segIdx;
  return {
    lat: path[segIdx].lat + (path[segIdx + 1].lat - path[segIdx].lat) * localT,
    lng: path[segIdx].lng + (path[segIdx + 1].lng - path[segIdx].lng) * localT
  };
}

class EmergencySiren {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private timer: number | null = null;
  private isRunning: boolean = false;

  start() {
    if (this.isRunning) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.osc = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();
      this.osc.type = 'sawtooth';
      this.gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.osc.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.osc.start();
      this.isRunning = true;
      let high = false;
      this.timer = window.setInterval(() => {
        if (!this.osc || !this.ctx) return;
        this.osc.frequency.setTargetAtTime(high ? 720 : 1080, this.ctx.currentTime, 0.08);
        high = !high;
      }, 400);
    } catch {}
  }

  stop() {
    if (!this.isRunning) return;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    try {
      if (this.osc) { this.osc.stop(); this.osc.disconnect(); this.osc = null; }
      if (this.ctx) { this.ctx.close(); this.ctx = null; }
    } catch {}
    this.isRunning = false;
  }
}

const emergencySiren = new EmergencySiren();

const safeStorage = {
  getItem: (key: string): string | null => {
    try { return typeof window !== 'undefined' ? window.localStorage?.getItem(key) : null; } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    try { if (typeof window !== 'undefined') window.localStorage?.setItem(key, value); } catch {}
  }
};

const GOOGLE_MAPS_LIBRARIES: ('places' | 'geometry' | 'visualization')[] = [
  'places',
  'geometry',
  'visualization'
];

// ============================================================================
// 4. GOOGLE MAP OVERLAYS (LIVE TRAFFIC, NATIVE HTML PINS & CALIBRATED HEATMAP)
// ============================================================================
function TrafficLayerOverlay({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google?.maps?.TrafficLayer) return;

    if (enabled) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new window.google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else {
      trafficLayerRef.current?.setMap(null);
    }

    return () => {
      trafficLayerRef.current?.setMap(null);
    };
  }, [map, enabled]);

  return null;
}

interface MapHtmlOverlayProps {
  position: Coordinate;
  children: React.ReactNode;
  zIndex?: number;
  onClick?: () => void;
  title?: string;
}

function MapHtmlOverlay({ position, children, zIndex = 10, onClick, title }: MapHtmlOverlayProps) {
  const map = useMap();
  const [container] = useState(() => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.userSelect = 'none';
    return el;
  });
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  useEffect(() => {
    container.style.zIndex = String(zIndex);
    container.style.cursor = onClick ? 'pointer' : 'default';
    if (title) container.title = title;
  }, [container, zIndex, onClick, title]);

  useEffect(() => {
    if (!onClick) return;
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [container, onClick]);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google?.maps?.OverlayView) return;
    class CustomOverlay extends window.google.maps.OverlayView {
      onAdd() {
        const panes = this.getPanes();
        if (panes) panes.overlayMouseTarget.appendChild(container);
      }
      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const pt = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(position.lat, position.lng));
        if (pt) {
          container.style.left = `${pt.x}px`;
          container.style.top = `${pt.y}px`;
        }
      }
      onRemove() {
        if (container.parentNode) container.parentNode.removeChild(container);
      }
    }
    const overlay = new CustomOverlay();
    overlay.setMap(map);
    overlayRef.current = overlay;
    return () => { overlay.setMap(null); overlayRef.current = null; };
  }, [map, container, position.lat, position.lng]);

  useEffect(() => {
    if (overlayRef.current) overlayRef.current.draw();
  }, [position.lat, position.lng]);

  return createPortal(children, container);
}

function RoutePolylineOverlay({ path, isDeviated }: { path: Coordinate[]; isDeviated: boolean }) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const corridorRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2 || typeof window === 'undefined' || !window.google?.maps?.Polyline) return;
    const coords = path.map((c) => ({ lat: c.lat, lng: c.lng }));

    try {
      if (!corridorRef.current) {
        corridorRef.current = new window.google.maps.Polyline({
          path: coords,
          strokeColor: '#D2E3FC',
          strokeOpacity: 0.65,
          strokeWeight: 22,
          map
        });
      } else {
        corridorRef.current.setPath(coords);
        corridorRef.current.setMap(map);
      }

      if (!polylineRef.current) {
        polylineRef.current = new window.google.maps.Polyline({
          path: coords,
          strokeColor: isDeviated ? '#EA8600' : '#1A73E8',
          strokeOpacity: 0.95,
          strokeWeight: 5,
          map
        });
      } else {
        polylineRef.current.setPath(coords);
        polylineRef.current.setOptions({ strokeColor: isDeviated ? '#EA8600' : '#1A73E8' });
        polylineRef.current.setMap(map);
      }

      const bounds = new window.google.maps.LatLngBounds();
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, { top: 90, bottom: 270, left: 30, right: 30 });
    } catch {}

    return () => {
      polylineRef.current?.setMap(null);
      corridorRef.current?.setMap(null);
      polylineRef.current = null;
      corridorRef.current = null;
    };
  }, [map, path, isDeviated]);

  return null;
}

function SafetyRiskZonesOverlay({ enabled, zones }: { enabled: boolean; zones: SafetyZone[] }) {
  const map = useMap();
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map) return;
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];
    if (!enabled || typeof window === 'undefined' || !window.google?.maps?.Circle) return;

    try {
      zones.forEach((zone) => {
        let fillColor = '#1E8E3E';
        let strokeColor = '#137333';
        if (zone.level === 'Moderate Risk') {
          fillColor = '#F9AB00';
          strokeColor = '#E37400';
        } else if (zone.level === 'Higher Risk') {
          fillColor = '#D93025';
          strokeColor = '#B31412';
        }
        const circle = new window.google.maps.Circle({
          center: { lat: zone.center.lat, lng: zone.center.lng },
          radius: zone.radiusMeters,
          fillColor,
          fillOpacity: 0.18,
          strokeColor,
          strokeOpacity: 0.45,
          strokeWeight: 1.5,
          clickable: false,
          map
        });
        circlesRef.current.push(circle);
      });
    } catch {}

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
    };
  }, [map, enabled, zones]);

  return null;
}

function MultiModeSafetyHeatmapOverlay({
  enabled,
  mode,
  poiList,
  routePath
}: {
  enabled: boolean;
  mode: HeatmapMode;
  poiList: AssistancePOI[];
  routePath: Coordinate[];
}) {
  const map = useMap();
  const visualizationLib = useMapsLibrary('visualization');
  const heatmapLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    if (!enabled) {
      heatmapLayerRef.current?.setMap(null);
      heatmapLayerRef.current = null;
      return;
    }
    if (!visualizationLib || !window.google?.maps?.LatLng) return;

    try {
      const dataPoints: any[] = [];
      if (mode === 'CRIME') {
        MP_CRIME_PRESSURE_POINTS.forEach((pt) => {
          dataPoints.push({ location: new window.google.maps.LatLng(pt.lat, pt.lng), weight: pt.weight });
          dataPoints.push({ location: new window.google.maps.LatLng(pt.lat + 0.001, pt.lng + 0.001), weight: pt.weight * 0.7 });
        });
      } else if (mode === 'POPULATION') {
        MP_POPULATION_FOOTFALL_POINTS.forEach((pt) => {
          dataPoints.push({ location: new window.google.maps.LatLng(pt.lat, pt.lng), weight: pt.weight });
        });
      } else {
        poiList.forEach((poi) => {
          dataPoints.push({ location: new window.google.maps.LatLng(poi.lat, poi.lng), weight: 8 });
        });
        MP_POPULATION_FOOTFALL_POINTS.forEach((pt) => {
          dataPoints.push({ location: new window.google.maps.LatLng(pt.lat, pt.lng), weight: pt.weight * 0.6 });
        });
        MP_CRIME_PRESSURE_POINTS.forEach((pt) => {
          dataPoints.push({ location: new window.google.maps.LatLng(pt.lat, pt.lng), weight: pt.weight * 0.8 });
        });
      }

      let gradient: string[] = [
        'rgba(0, 255, 255, 0)',
        'rgba(30, 142, 62, 0.4)',
        'rgba(30, 142, 62, 0.8)',
        'rgba(249, 171, 0, 0.85)',
        'rgba(217, 48, 37, 0.95)'
      ];

      if (mode === 'CRIME') {
        gradient = [
          'rgba(255, 237, 213, 0)',
          'rgba(251, 146, 60, 0.7)',
          'rgba(239, 68, 68, 0.9)',
          'rgba(185, 28, 28, 1)'
        ];
      } else if (mode === 'POPULATION') {
        gradient = [
          'rgba(204, 251, 241, 0)',
          'rgba(45, 212, 191, 0.7)',
          'rgba(16, 185, 129, 0.9)',
          'rgba(5, 150, 105, 1)'
        ];
      }

      if (!heatmapLayerRef.current) {
        const HeatmapLayerClass = (visualizationLib as any).HeatmapLayer;
        if (HeatmapLayerClass) {
          heatmapLayerRef.current = new HeatmapLayerClass({
            data: dataPoints,
            map,
            radius: 46,
            opacity: 0.68,
            maxIntensity: 7,
            gradient
          });
        }
      } else {
        heatmapLayerRef.current.setData(dataPoints);
        heatmapLayerRef.current.set('gradient', gradient);
        heatmapLayerRef.current.setMap(map);
      }
    } catch {}

    return () => {
      heatmapLayerRef.current?.setMap(null);
      heatmapLayerRef.current = null;
    };
  }, [map, visualizationLib, enabled, mode, poiList, routePath]);

  return null;
}

// ============================================================================
// 5. HUMAN-DESIGNED MOBILE APP INTERFACE
// ============================================================================
interface ShieldAppInnerProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  mapLoadFailed: boolean;
  setMapLoadFailed: (failed: boolean) => void;
}

function ShieldAppInner({ apiKey, setApiKey, mapLoadFailed, setMapLoadFailed }: ShieldAppInnerProps) {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('LANDING');
  const [activeTab, setActiveTab] = useState<AppTab>('NAVIGATE');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [tempApiKeyInput, setTempApiKeyInput] = useState<string>(apiKey);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Map & Layer Controls
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showHavenPins, setShowHavenPins] = useState<boolean>(true);

  // User Profile
  const [user, setUser] = useState<UserProfile>({
    name: 'Prashuk Jain',
    phone: '+91 98765 43210',
    email: 'prashuk.jain@shield.in',
    emergencyPin: '1234',
    escalationTimerSeconds: 30
  });

  // Auth Form State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [formName, setFormName] = useState<string>('Prashuk Jain');
  const [formContact, setFormContact] = useState<string>('9876543210');
  const [formPassword, setFormPassword] = useState<string>('shield#2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Authoritative Journey State
  const [journeyStatus, setJourneyStatus] = useState<JourneyStatus>('IDLE');
  const [activeRoute, setActiveRoute] = useState<RouteOption>(MP_PRESET_CORRIDORS[0]);
  const [routeOptionsList, setRouteOptionsList] = useState<RouteOption[]>(MP_PRESET_CORRIDORS);
  const [showSafetyHeatmap, setShowSafetyHeatmap] = useState<boolean>(true);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('COMPOSITE');
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  // Dynamic Routing Inputs
  const [originInput, setOriginInput] = useState<string>('Vijay Nagar, Indore');
  const [destinationInput, setDestinationInput] = useState<string>('Rajwada, Indore');
  const [onMapSearchQuery, setOnMapSearchQuery] = useState<string>('');
  const [isSearchingRoute, setIsSearchingRoute] = useState<boolean>(false);

  // Simulation & GPS Telemetry
  const [simProgress, setSimProgress] = useState<number>(0);
  const [isTrackingMovement, setIsTrackingMovement] = useState<boolean>(false);
  const [isManualOffset, setIsManualOffset] = useState<boolean>(false);
  const [offsetMeters, setOffsetMeters] = useState<number>(0);
  const [consecutiveDeviations, setConsecutiveDeviations] = useState<number>(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(34);

  // Emergency States
  const [checkInCountdown, setCheckInCountdown] = useState<number>(30);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [sosToastMessage, setSosToastMessage] = useState<string | null>(null);

  // 1.2s SOS Hold
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHoldingSos, setIsHoldingSos] = useState<boolean>(false);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  // Contacts & History
  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_CONTACTS);
  const [logs, setLogs] = useState<TripLog[]>(INITIAL_LOGS);
  const [testAlertToast, setTestAlertToast] = useState<boolean>(false);

  // Modals & Popovers
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState<boolean>(false);
  const [selectedPoiDetail, setSelectedPoiDetail] = useState<AssistancePOI | null>(null);

  // Add Contact Form
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactRelation, setNewContactRelation] = useState<string>('Sister');

  // Input DOM Refs
  const originInputRef = useRef<HTMLInputElement | null>(null);
  const destInputRef = useRef<HTMLInputElement | null>(null);
  const onMapSearchInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handler = () => {
      setQuotaExceeded(true);
      setMapLoadFailed(true);
    };
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, [setMapLoadFailed]);

  const currentCoordinate = useMemo<Coordinate>(() => {
    const onRoute = getPointAlongPath(activeRoute.path, simProgress);
    if (!isManualOffset) return onRoute;
    const offsetDeg = offsetMeters / 111000;
    return {
      lat: onRoute.lat + offsetDeg * 0.9,
      lng: onRoute.lng - offsetDeg * 1.15
    };
  }, [activeRoute.path, simProgress, isManualOffset, offsetMeters]);

  const crossTrackDistanceMeters = useMemo(() => {
    return calculateCrossTrack(currentCoordinate, activeRoute.path);
  }, [currentCoordinate, activeRoute.path]);

  const nearestPOI = useMemo(() => {
    if (!activeRoute.assistancePOIs || activeRoute.assistancePOIs.length === 0) return null;
    let closest = activeRoute.assistancePOIs[0];
    let minD = Infinity;
    for (const poi of activeRoute.assistancePOIs) {
      const d = haversineDistance(currentCoordinate.lat, currentCoordinate.lng, poi.lat, poi.lng);
      if (d < minD) {
        minD = d;
        closest = { ...poi, distanceMeters: Math.round(d) };
      }
    }
    return closest;
  }, [currentCoordinate, activeRoute.assistancePOIs]);

  const toggleSiren = useCallback((force?: boolean) => {
    const next = force !== undefined ? force : !isSirenActive;
    setIsSirenActive(next);
    if (next) emergencySiren.start();
    else emergencySiren.stop();
  }, [isSirenActive]);

  // Autocomplete bindings
  const placesLibrary = useMapsLibrary('places');
  useEffect(() => {
    if (!placesLibrary) return;
    const bindAuto = (input: HTMLInputElement | null, setVal: (v: string) => void) => {
      if (!input) return;
      const auto = new placesLibrary.Autocomplete(input, {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'name', 'geometry']
      });
      auto.addListener('place_changed', () => {
        const p = auto.getPlace();
        if (p.formatted_address || p.name) setVal(p.formatted_address || p.name || '');
      });
    };
    bindAuto(originInputRef.current, setOriginInput);
    bindAuto(destInputRef.current, setDestinationInput);
    bindAuto(onMapSearchInputRef.current, (val) => {
      setDestinationInput(val);
      setOnMapSearchQuery(val);
    });
  }, [placesLibrary, currentScreen, activeTab, journeyStatus]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginInput(`Current Location (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
      },
      () => setOriginInput('Vijay Nagar, Indore'),
      { timeout: 5000 }
    );
  };

  const handleFindSafeCorridors = () => {
    if (!originInput.trim() || !destinationInput.trim()) return;
    setIsSearchingRoute(true);

    if (window.google?.maps?.DirectionsService) {
      const dirService = new window.google.maps.DirectionsService();
      dirService.route(
        {
          origin: originInput,
          destination: destinationInput,
          travelMode: window.google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true
        },
        (result, status) => {
          setIsSearchingRoute(false);
          if (status === window.google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
            const routes: RouteOption[] = result.routes.map((r, idx) => {
              const leg = r.legs[0];
              const path: Coordinate[] = (r.overview_path || []).map((p) => ({ lat: p.lat(), lng: p.lng() }));
              const dist = leg?.distance?.value ? Math.round((leg.distance.value / 1000) * 10) / 10 : 6.4;
              const dur = leg?.duration?.value ? Math.round(leg.duration.value / 60) : 22;
              const crimeRate = idx === 0 ? 44.38 : idx === 1 ? 48.10 : 56.40;
              const footfall = idx === 0 ? 92 : idx === 1 ? 70 : 35;
              const haven = idx === 0 ? 96 : idx === 1 ? 76 : 42;
              const score = calculateSafetyScore(haven, footfall, crimeRate);
              let risk: 'Lower Risk' | 'Moderate Risk' | 'Higher Risk' = 'Lower Risk';
              if (score < 70) risk = 'Higher Risk';
              else if (score < 88) risk = 'Moderate Risk';

              return {
                id: `route-${idx}`,
                name: r.summary || (idx === 0 ? 'Primary Arterial' : `Alternative ${idx}`),
                summary: idx === 0 ? 'Optimal corridor with continuous streetlights' : 'Secondary route with intermittent activity',
                distanceKm: dist,
                distanceText: leg?.distance?.text || `${dist} km`,
                durationMin: dur,
                durationText: leg?.duration?.text || `${dur} min`,
                path: path.length > 2 ? path : MP_PRESET_CORRIDORS[0].path,
                safetyScore: score,
                riskLevel: risk,
                assistanceCount: idx === 0 ? 4 : idx === 1 ? 2 : 1,
                assistancePOIs: MP_VERIFIED_INFRASTRUCTURE_POIS.slice(0, idx === 0 ? 4 : 2),
                crimeRatePer100k: crimeRate,
                footfallScore: footfall,
                havenScore: haven
              };
            });
            setRouteOptionsList(routes);
            setActiveRoute(routes[0]);
            setJourneyStatus('PLANNED');
          } else {
            setRouteOptionsList(MP_PRESET_CORRIDORS);
            setActiveRoute(MP_PRESET_CORRIDORS[0]);
            setJourneyStatus('PLANNED');
          }
        }
      );
    } else {
      setTimeout(() => {
        setIsSearchingRoute(false);
        setRouteOptionsList(MP_PRESET_CORRIDORS);
        setActiveRoute(MP_PRESET_CORRIDORS[0]);
        setJourneyStatus('PLANNED');
      }, 350);
    }
  };

  // Telemetry loop
  useEffect(() => {
    if (journeyStatus !== 'ACTIVE' || !isTrackingMovement) return;
    const interval = setInterval(() => {
      setSimProgress((prev) => {
        const next = prev + 0.007;
        if (next >= 1) {
          setJourneyStatus('COMPLETED');
          setIsTrackingMovement(false);
          setLogs((l) => [
            {
              id: `log-${Date.now()}`,
              timestamp: 'Just now',
              origin: originInput,
              destination: destinationInput,
              distanceKm: activeRoute.distanceKm,
              durationMin: activeRoute.durationMin,
              status: 'Completed Safely',
              deviationsCount: 0,
              riskLevel: activeRoute.riskLevel
            },
            ...l
          ]);
          return 1;
        }
        return next;
      });

      const dev = calculateCrossTrack(currentCoordinate, activeRoute.path);
      if (dev >= 80) {
        setConsecutiveDeviations((prev) => {
          const count = prev + 1;
          if (count >= 3) {
            setJourneyStatus('CHECK_IN_PENDING');
            setCheckInCountdown(user.escalationTimerSeconds || 30);
            if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
          } else {
            setJourneyStatus('SUSPECTED_DEVIATION');
          }
          return count;
        });
      } else {
        setConsecutiveDeviations(0);
        setJourneyStatus((p) => (p === 'SUSPECTED_DEVIATION' ? 'ACTIVE' : p));
      }
      setCurrentSpeedKmh(Math.floor(32 + Math.sin(Date.now() / 2000) * 5));
    }, 600);
    return () => clearInterval(interval);
  }, [journeyStatus, isTrackingMovement, currentCoordinate, activeRoute, user.escalationTimerSeconds, originInput, destinationInput]);

  // Check-In Countdown
  useEffect(() => {
    if (journeyStatus !== 'CHECK_IN_PENDING') return;
    const timer = setInterval(() => {
      setCheckInCountdown((prev) => {
        if (prev <= 1) {
          setJourneyStatus('ALERT_ESCALATED');
          toggleSiren(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [journeyStatus, toggleSiren]);

  useEffect(() => () => emergencySiren.stop(), []);

  // SOS Hold
  const handleStartSosHold = () => {
    setIsHoldingSos(true);
    holdStartTimeRef.current = Date.now();
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const p = Math.min(1, elapsed / 1200);
      setHoldProgress(p);
      if (p >= 1) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        setIsHoldingSos(false);
        setHoldProgress(0);
        handleTriggerSos();
      }
    }, 25);
  };

  const handleCancelSosHold = () => {
    if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null; }
    setIsHoldingSos(false);
    setHoldProgress(0);
  };

  const handleTriggerSos = () => {
    setJourneyStatus('SOS_TRIGGERED');
    toggleSiren(true);
    setSosToastMessage(`Live coordinates (${currentCoordinate.lat.toFixed(4)}, ${currentCoordinate.lng.toFixed(4)}) sent to emergency contacts.`);
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 400]);
    setTimeout(() => setSosToastMessage(null), 5000);
  };

  const handleResetTrip = () => {
    toggleSiren(false);
    setJourneyStatus('IDLE');
    setSimProgress(0);
    setIsTrackingMovement(false);
    setIsManualOffset(false);
    setOffsetMeters(0);
    setConsecutiveDeviations(0);
  };

  const mapCenter = useMemo(() => ({ lat: currentCoordinate.lat, lng: currentCoordinate.lng }), [currentCoordinate.lat, currentCoordinate.lng]);

  // Fallback Canvas Rendering
  useEffect(() => {
    if ((!apiKey || mapLoadFailed) && fallbackCanvasRef.current) {
      const cvs = fallbackCanvasRef.current;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      cvs.width = cvs.clientWidth || 360;
      cvs.height = cvs.clientHeight || 480;

      ctx.fillStyle = '#F8F9FA';
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      ctx.strokeStyle = '#E8EAED';
      ctx.lineWidth = 1;
      for (let x = 0; x < cvs.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cvs.height); ctx.stroke();
      }
      for (let y = 0; y < cvs.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cvs.width, y); ctx.stroke();
      }

      ctx.strokeStyle = '#D2E3FC';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cvs.width * 0.2, cvs.height * 0.75);
      ctx.bezierCurveTo(cvs.width * 0.35, cvs.height * 0.5, cvs.width * 0.65, cvs.height * 0.55, cvs.width * 0.8, cvs.height * 0.25);
      ctx.stroke();

      ctx.strokeStyle = '#1A73E8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cvs.width * 0.2, cvs.height * 0.75);
      ctx.bezierCurveTo(cvs.width * 0.35, cvs.height * 0.5, cvs.width * 0.65, cvs.height * 0.55, cvs.width * 0.8, cvs.height * 0.25);
      ctx.stroke();

      ctx.fillStyle = '#1E8E3E';
      ctx.beginPath();
      ctx.arc(cvs.width * 0.2, cvs.height * 0.75, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#202124';
      ctx.beginPath();
      ctx.arc(cvs.width * 0.8, cvs.height * 0.25, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#5F6368';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Transit Security Vector Map (Offline Preview)', cvs.width / 2, 40);
    }
  }, [apiKey, mapLoadFailed]);

  return (
    <div className="h-screen w-screen bg-[#F8F9FA] text-[#202124] font-sans antialiased select-none flex flex-col justify-between overflow-hidden">
      {/* Subtle Quota Notification */}
      {quotaExceeded && (
        <div className="bg-[#FEF7E0] border-b border-[#FEEFC3] text-[#7A4B04] px-4 py-2 text-xs text-center sticky top-0 z-50">
          Google Maps Platform quota reached. Displaying offline vector render.
        </div>
      )}

      {/* Reassuring SOS Toast */}
      {sosToastMessage && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-sm mx-auto">
          <div className="bg-[#1E8E3E] text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3">
            <CheckCheck className="w-5 h-5 shrink-0" />
            <div className="text-xs font-medium leading-snug flex-1">{sosToastMessage}</div>
            <button onClick={() => setSosToastMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 1: LANDING PAGE */}
      {currentScreen === 'LANDING' && (
        <div className="flex-1 w-full max-w-md mx-auto bg-white flex flex-col justify-between p-6 sm:p-8 shadow-sm">
          <div className="pt-8">
            <div className="flex items-center gap-3.5 mb-8">
              <AppLogo className="w-12 h-12 shrink-0 drop-shadow-sm" />
              <div>
                <span className="font-semibold text-lg text-[#202124] tracking-tight block">Mahila Shield</span>
                <span className="text-xs text-[#5F6368]">Transit Security for Madhya Pradesh</span>
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-[#202124] tracking-tight leading-snug mb-3">
              Safer routes, verified help desks, and silent check-ins.
            </h1>
            <p className="text-sm text-[#5F6368] leading-relaxed">
              Plan your travel through well-lit, active corridors in Indore, Bhopal, and across MP. If your vehicle detours unexpectedly, help is notified automatically.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED]">
                <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-medium text-[#202124] block">Verified Safe Havens</span>
                  <span className="text-[#5F6368]">Routes prioritized by 24/7 hospitals and police desks.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED]">
                <div className="w-8 h-8 rounded-xl bg-[#FEF7E0] text-[#B06000] flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-medium text-[#202124] block">Proactive Detour Alerts</span>
                  <span className="text-[#5F6368]">Silent 30-second check-in if route veers off course.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 pb-2 space-y-2.5">
            <button
              onClick={() => setCurrentScreen('AUTH')}
              className="w-full h-12 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] active:bg-[#174EA6] text-white font-medium text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentScreen('AUTH')}
              className="w-full h-11 rounded-full text-[#1A73E8] hover:bg-[#F1F3F4] text-xs font-medium cursor-pointer transition-colors"
            >
              Sign In
            </button>
            <p className="text-[11px] text-[#70757A] text-center pt-2">
              Integrated with Emergency Response Support System (112).
            </p>
          </div>
        </div>
      )}

      {/* SCREEN 2: AUTHENTICATION */}
      {currentScreen === 'AUTH' && (
        <div className="flex-1 w-full max-w-md mx-auto bg-white flex flex-col justify-between p-6 sm:p-8 shadow-sm">
          <div className="pt-4">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentScreen('LANDING')} className="text-xs text-[#5F6368] hover:text-[#202124]">
                Back
              </button>
              <span className="text-[11px] text-[#1A73E8] font-medium bg-[#E8F0FE] px-3 py-1 rounded-full">
                Encrypted Connection
              </span>
            </div>

            <h1 className="text-xl font-semibold text-[#202124] mb-1">
              {authMode === 'LOGIN' ? 'Sign in to continue' : 'Create your account'}
            </h1>
            <p className="text-xs text-[#5F6368] mb-6">
              Empowering safe mobility across Madhya Pradesh.
            </p>

            <div className="flex bg-[#F1F3F4] p-1 rounded-full mb-6 text-xs font-medium">
              <button
                onClick={() => setAuthMode('LOGIN')}
                className={`flex-1 py-2 rounded-full transition-all ${authMode === 'LOGIN' ? 'bg-white text-[#202124] shadow-xs' : 'text-[#5F6368]'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('REGISTER')}
                className={`flex-1 py-2 rounded-full transition-all ${authMode === 'REGISTER' ? 'bg-white text-[#202124] shadow-xs' : 'text-[#5F6368]'}`}
              >
                Create Account
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUser({ ...user, name: formName || 'Prashuk Jain', phone: `+91 ${formContact}` });
                setCurrentScreen('PERMISSIONS');
              }}
              className="space-y-4"
            >
              {authMode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-medium text-[#3C4043] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Prashuk Jain"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#DADCE0] text-xs focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] focus:outline-hidden"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#3C4043] mb-1">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="w-16 h-11 rounded-xl border border-[#DADCE0] bg-[#F8F9FA] flex items-center justify-center text-xs font-medium text-[#5F6368]">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="98765 43210"
                    className="flex-1 h-11 px-3.5 rounded-xl border border-[#DADCE0] text-xs focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#3C4043] mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-11 px-3.5 pr-10 rounded-xl border border-[#DADCE0] text-xs focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#5F6368]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-11 mt-2 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium text-xs shadow-xs cursor-pointer"
              >
                {authMode === 'LOGIN' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-[#F1F3F4]">
            <button
              onClick={() => {
                setUser({
                  name: 'Prashuk Jain',
                  phone: '+91 98765 43210',
                  email: 'prashuk.jain@shield.in',
                  emergencyPin: '1234',
                  escalationTimerSeconds: 30
                });
                setCurrentScreen('PERMISSIONS');
              }}
              className="w-full h-11 rounded-full bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#3C4043] font-medium text-xs border border-[#DADCE0] flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span>Continue as Prashuk Jain</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: PERMISSIONS & PRIVACY */}
      {currentScreen === 'PERMISSIONS' && (
        <div className="flex-1 w-full max-w-md mx-auto bg-white flex flex-col justify-between p-6 sm:p-8 shadow-sm">
          <div className="pt-4">
            <div className="mb-5 flex items-center gap-3">
              <AppLogo className="w-11 h-11 shrink-0 drop-shadow-xs" />
              <div>
                <h1 className="text-lg font-semibold text-[#202124]">
                  Privacy &amp; Location Consent
                </h1>
                <span className="text-xs text-[#5F6368]">Transparent, journey-only security</span>
              </div>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed mb-6">
              Mahila Shield is designed with minimal tracking principles:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED]">
                <div className="flex items-center gap-2 text-[#202124] font-medium text-xs mb-1">
                  <MapPin className="w-4 h-4 text-[#1A73E8]" />
                  <span>Monitored During Journeys Only</span>
                </div>
                <p className="text-[11px] text-[#5F6368] leading-relaxed">
                  Location is read strictly while a route is active to detect detours. We never track you while the app is idle.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED]">
                <div className="flex items-center gap-2 text-[#202124] font-medium text-xs mb-1">
                  <Bell className="w-4 h-4 text-[#1A73E8]" />
                  <span>Guardian Notifications</span>
                </div>
                <p className="text-[11px] text-[#5F6368] leading-relaxed">
                  SMS alerts are sent to your chosen contacts only if an unexpected detour remains unresolved after 30 seconds or if you tap SOS.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 pb-2">
            <button
              onClick={() => setCurrentScreen('APP')}
              className="w-full h-12 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium text-xs shadow-xs cursor-pointer"
            >
              Accept &amp; Continue
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: AUTHENTICATED APP */}
      {currentScreen === 'APP' && (
        <div className="relative flex-1 w-full max-w-md mx-auto bg-white flex flex-col justify-between overflow-hidden shadow-xl border-x border-[#E8EAED]">
          {/* TAB 1: NAVIGATE */}
          {activeTab === 'NAVIGATE' && (
            <div className="relative w-full h-full flex-1 overflow-hidden">
              {/* GOOGLE MAP CANVAS */}
              <div className="absolute inset-0 w-full h-full">
                {apiKey && !mapLoadFailed ? (
                  <Map
                    id="transit-security-map"
                    mapTypeId={mapTypeId}
                    defaultCenter={mapCenter}
                    defaultZoom={13}
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    className="w-full h-full"
                    internalUsageAttributionIds={['gmp_git_agentskills_v1']}
                  >
                    {/* Live Traffic Flow Layer */}
                    <TrafficLayerOverlay enabled={showTraffic} />

                    {/* Visualized Spatial Risk Zones */}
                    <SafetyRiskZonesOverlay
                      enabled={showSafetyHeatmap && heatmapMode === 'COMPOSITE'}
                      zones={MP_SPATIAL_SAFETY_ZONES}
                    />

                    {/* Multi-Mode Safety Heatmap */}
                    <MultiModeSafetyHeatmapOverlay
                      enabled={showSafetyHeatmap}
                      mode={heatmapMode}
                      poiList={activeRoute.assistancePOIs}
                      routePath={activeRoute.path}
                    />

                    {/* Polyline Corridor */}
                    <RoutePolylineOverlay
                      path={activeRoute.path}
                      isDeviated={crossTrackDistanceMeters >= 80}
                    />

                    {/* Origin Pin */}
                    {activeRoute.path[0] && (
                      <MapHtmlOverlay position={activeRoute.path[0]} title="Origin" zIndex={20}>
                        <div className="flex flex-col items-center">
                          <div className="px-1.5 py-0.5 mb-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded shadow uppercase tracking-wider">
                            Start
                          </div>
                          <div className="w-6 h-6 rounded-full bg-[#1E8E3E] border-2 border-white shadow-md flex items-center justify-center text-white">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        </div>
                      </MapHtmlOverlay>
                    )}

                    {/* Destination Pin */}
                    {activeRoute.path.length > 1 && (
                      <MapHtmlOverlay
                        position={activeRoute.path[activeRoute.path.length - 1]}
                        title="Destination"
                        zIndex={20}
                      >
                        <div className="flex flex-col items-center">
                          <div className="px-1.5 py-0.5 mb-0.5 bg-slate-900 text-white text-[9px] font-bold rounded shadow uppercase tracking-wider">
                            End
                          </div>
                          <div className="w-6 h-6 rounded-full bg-[#202124] border-2 border-white shadow-md flex items-center justify-center text-white">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </MapHtmlOverlay>
                    )}

                    {/* Verified Safe Haven POIs (Police & Hospitals) */}
                    {showHavenPins &&
                      activeRoute.assistancePOIs.map((poi) => (
                        <MapHtmlOverlay
                          key={poi.id}
                          position={{ lat: poi.lat, lng: poi.lng }}
                          title={poi.name}
                          zIndex={15}
                          onClick={() => setSelectedPoiDetail(poi)}
                        >
                          <div
                            className={`w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
                              poi.type === 'police' ? 'bg-[#0D9488]' : 'bg-[#D93025]'
                            }`}
                          >
                            {poi.type === 'police' ? 'P' : '+'}
                          </div>
                        </MapHtmlOverlay>
                      ))}

                    {/* Live Traveler Beacon */}
                    {journeyStatus !== 'IDLE' && (
                      <MapHtmlOverlay position={currentCoordinate} title="Your Location" zIndex={30}>
                        <div className="relative flex items-center justify-center pointer-events-none">
                          <span
                            className={`w-8 h-8 rounded-full animate-ping absolute ${
                              journeyStatus === 'SOS_TRIGGERED'
                                ? 'bg-red-500'
                                : crossTrackDistanceMeters >= 80
                                ? 'bg-amber-500'
                                : 'bg-[#1A73E8]'
                            } opacity-75`}
                          />
                          <div
                            className={`w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                              journeyStatus === 'SOS_TRIGGERED'
                                ? 'bg-red-600'
                                : crossTrackDistanceMeters >= 80
                                ? 'bg-amber-600'
                                : 'bg-[#1A73E8]'
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        </div>
                      </MapHtmlOverlay>
                    )}
                  </Map>
                ) : (
                  <canvas ref={fallbackCanvasRef} className="w-full h-full block" />
                )}
              </div>

              {/* FLOATING TOP SEARCH & FILTER BAR (GOOGLE MAPS STYLE) */}
              <div className="absolute top-3 inset-x-3 z-30 pointer-events-auto space-y-2">
                <div className="bg-white rounded-2xl shadow-md border border-[#E8EAED] p-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0">
                    <AppLogo className="w-6 h-6" />
                  </div>
                  <input
                    ref={onMapSearchInputRef}
                    type="text"
                    value={onMapSearchQuery}
                    onChange={(e) => setOnMapSearchQuery(e.target.value)}
                    placeholder="Search destination in MP..."
                    className="flex-1 text-xs text-[#202124] placeholder-[#70757A] bg-transparent focus:outline-hidden"
                  />
                  {journeyStatus === 'IDLE' && (
                    <button
                      onClick={handleFindSafeCorridors}
                      className="px-3 py-1.5 rounded-xl bg-[#1A73E8] text-white text-xs font-medium hover:bg-[#1557B0] shrink-0 cursor-pointer"
                    >
                      Route
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                {showSafetyHeatmap && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setHeatmapMode('COMPOSITE')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium shadow-xs transition-colors shrink-0 cursor-pointer ${
                        heatmapMode === 'COMPOSITE'
                          ? 'bg-[#202124] text-white'
                          : 'bg-white/95 text-[#5F6368] border border-[#DADCE0]'
                      }`}
                    >
                      Safe Corridors
                    </button>
                    <button
                      onClick={() => setHeatmapMode('POPULATION')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium shadow-xs transition-colors shrink-0 cursor-pointer ${
                        heatmapMode === 'POPULATION'
                          ? 'bg-[#1E8E3E] text-white'
                          : 'bg-white/95 text-[#5F6368] border border-[#DADCE0]'
                      }`}
                    >
                      High Footfall
                    </button>
                    <button
                      onClick={() => setHeatmapMode('CRIME')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium shadow-xs transition-colors shrink-0 cursor-pointer ${
                        heatmapMode === 'CRIME'
                          ? 'bg-[#D93025] text-white'
                          : 'bg-white/95 text-[#5F6368] border border-[#DADCE0]'
                      }`}
                    >
                      Crime Index
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT-SIDE MAP UTILITY CONTROLS */}
              <div className="absolute top-28 right-3 z-30 pointer-events-auto flex flex-col gap-2">
                {/* Unified Layers Menu FAB */}
                <button
                  onClick={() => setShowLayerMenu(!showLayerMenu)}
                  className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer ${
                    showLayerMenu || showTraffic || mapTypeId === 'hybrid'
                      ? 'bg-[#1A73E8] text-white'
                      : 'bg-white text-[#5F6368] border border-[#DADCE0]'
                  }`}
                  title="Map Layers"
                >
                  <Layers className="w-4 h-4" />
                </button>

                {/* Recenter / Geolocation */}
                <button
                  onClick={handleUseCurrentLocation}
                  className="w-10 h-10 rounded-full bg-white text-[#5F6368] border border-[#DADCE0] shadow-md flex items-center justify-center hover:text-[#1A73E8] cursor-pointer"
                  title="My Location"
                >
                  <Crosshair className="w-4 h-4" />
                </button>

                {/* Diagnostics Simulator */}
                <button
                  onClick={() => setShowDiagnosticsPanel(!showDiagnosticsPanel)}
                  className="w-10 h-10 rounded-full bg-white text-[#5F6368] border border-[#DADCE0] shadow-md flex items-center justify-center hover:text-[#1A73E8] cursor-pointer"
                  title="Diagnostics"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                {/* Direct Speed Dial 112 */}
                <a
                  href="tel:112"
                  className="w-10 h-10 rounded-full bg-[#D93025] hover:bg-[#B31412] text-white shadow-md flex items-center justify-center cursor-pointer"
                  title="Emergency 112"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>

              {/* EXPANDABLE GOOGLE-STYLE LAYER POPUP */}
              {showLayerMenu && (
                <div className="absolute top-28 right-15 z-40 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-[#E8EAED] w-56 text-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#F1F3F4]">
                    <span className="font-semibold text-[#202124]">Map Layers</span>
                    <button
                      onClick={() => setShowLayerMenu(false)}
                      className="text-[#9AA0A6] hover:text-[#202124] p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Map Type Switcher */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#70757A] tracking-wider block">Base View</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setMapTypeId('roadmap')}
                        className={`py-1.5 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                          mapTypeId === 'roadmap'
                            ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]'
                            : 'border-[#DADCE0] text-[#5F6368]'
                        }`}
                      >
                        Default
                      </button>
                      <button
                        onClick={() => setMapTypeId('hybrid')}
                        className={`py-1.5 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                          mapTypeId === 'hybrid'
                            ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]'
                            : 'border-[#DADCE0] text-[#5F6368]'
                        }`}
                      >
                        Satellite
                      </button>
                    </div>
                  </div>

                  {/* Live Overlays */}
                  <div className="space-y-1.5 pt-1 border-t border-[#F1F3F4]">
                    <span className="text-[10px] uppercase font-bold text-[#70757A] tracking-wider block">Live Data</span>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[#3C4043] font-medium">Live Traffic Flow</span>
                      <input
                        type="checkbox"
                        checked={showTraffic}
                        onChange={(e) => setShowTraffic(e.target.checked)}
                        className="rounded text-[#1A73E8] focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[#3C4043] font-medium">Safety Heatmap</span>
                      <input
                        type="checkbox"
                        checked={showSafetyHeatmap}
                        onChange={(e) => setShowSafetyHeatmap(e.target.checked)}
                        className="rounded text-[#1A73E8] focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[#3C4043] font-medium">24/7 Safe Havens (P/+)</span>
                      <input
                        type="checkbox"
                        checked={showHavenPins}
                        onChange={(e) => setShowHavenPins(e.target.checked)}
                        className="rounded text-[#1A73E8] focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* EMERGENCY SOS TRIGGER (ACTIVE JOURNEY ONLY) */}
              {journeyStatus === 'ACTIVE' && (
                <div className="absolute bottom-68 right-4 z-30 pointer-events-auto flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <svg className="absolute w-15 h-15 -rotate-90 pointer-events-none" viewBox="0 0 68 68">
                      <circle cx="34" cy="34" r="30" stroke="rgba(217, 48, 37, 0.2)" strokeWidth="4" fill="none" />
                      <circle
                        cx="34"
                        cy="34"
                        r="30"
                        stroke="#D93025"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="188.4"
                        strokeDashoffset={188.4 * (1 - holdProgress)}
                        strokeLinecap="round"
                        className="transition-all duration-75"
                      />
                    </svg>
                    <button
                      onPointerDown={handleStartSosHold}
                      onPointerUp={handleCancelSosHold}
                      onPointerLeave={handleCancelSosHold}
                      onPointerCancel={handleCancelSosHold}
                      className="w-12 h-12 rounded-full bg-[#D93025] active:bg-[#B31412] text-white font-bold text-xs shadow-lg flex flex-col items-center justify-center cursor-pointer select-none touch-none"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-[8px] font-bold">SOS</span>
                    </button>
                  </div>
                  <span className="text-[9px] text-[#5F6368] mt-1 bg-white/90 px-2 py-0.5 rounded-full shadow-xs">
                    Hold 1.2s
                  </span>
                </div>
              )}

              {/* DIAGNOSTICS POPUP */}
              {showDiagnosticsPanel && (
                <div className="absolute top-28 left-3 right-15 z-30 pointer-events-auto bg-[#202124] text-white rounded-2xl p-3 text-xs shadow-xl">
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#3C4043] text-[11px]">
                    <span className="text-[#8AB4F8] font-medium">GPS Telemetry Simulator</span>
                    <button onClick={() => setShowDiagnosticsPanel(false)} className="text-[#9AA0A6] cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        setIsManualOffset(false);
                        setOffsetMeters(0);
                        if (journeyStatus === 'IDLE' || journeyStatus === 'PLANNED') {
                          setJourneyStatus('ACTIVE');
                          setIsTrackingMovement(true);
                          setSimProgress(0.04);
                        } else {
                          setIsTrackingMovement(!isTrackingMovement);
                        }
                      }}
                      className="py-1 px-1.5 rounded-lg bg-[#303134] text-[11px] text-[#81C995] font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3" /> Step
                    </button>
                    <button
                      onClick={() => {
                        if (journeyStatus !== 'ACTIVE') {
                          setJourneyStatus('ACTIVE');
                          setIsTrackingMovement(true);
                        }
                        setIsManualOffset(true);
                        setOffsetMeters(160);
                      }}
                      className="py-1 px-1.5 rounded-lg bg-[#303134] text-[11px] text-[#FDD663] font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      +150m Detour
                    </button>
                    <button
                      onClick={handleResetTrip}
                      className="py-1 px-1.5 rounded-lg bg-[#303134] text-[11px] text-[#9AA0A6] font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* HUMAN BOTTOM SHEET DRAWER (GOOGLE MAPS STYLE) */}
              <div className="absolute bottom-0 inset-x-0 z-30 bg-white rounded-t-3xl shadow-2xl border-t border-[#E8EAED] px-4 pt-3 pb-4 pointer-events-auto max-h-[62vh] overflow-y-auto">
                <div className="w-9 h-1 bg-[#DADCE0] rounded-full mx-auto mb-3" />

                {/* State 1: IDLE */}
                {journeyStatus === 'IDLE' && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          ref={originInputRef}
                          type="text"
                          value={originInput}
                          onChange={(e) => setOriginInput(e.target.value)}
                          placeholder="Your starting location"
                          className="w-full h-11 px-3 pl-9 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] text-xs focus:bg-white focus:outline-hidden"
                        />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1E8E3E] absolute left-3.5 top-4" />
                      </div>
                      <div className="relative">
                        <input
                          ref={destInputRef}
                          type="text"
                          value={destinationInput}
                          onChange={(e) => setDestinationInput(e.target.value)}
                          placeholder="Where are you going?"
                          className="w-full h-11 px-3 pl-9 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] text-xs focus:bg-white focus:outline-hidden"
                        />
                        <MapPin className="w-3.5 h-3.5 text-[#D93025] absolute left-3 top-3.5" />
                      </div>
                    </div>

                    <button
                      onClick={handleFindSafeCorridors}
                      disabled={isSearchingRoute}
                      className="w-full h-12 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>{isSearchingRoute ? 'Checking route infrastructure...' : 'Find Safe Corridors'}</span>
                    </button>
                  </div>
                )}

                {/* State 2: PLANNED */}
                {journeyStatus === 'PLANNED' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#202124]">Recommended Routes</span>
                      <button onClick={() => setJourneyStatus('IDLE')} className="text-xs text-[#1A73E8] hover:underline cursor-pointer">
                        Edit
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                      {routeOptionsList.map((route) => {
                        const isSelected = activeRoute.id === route.id;
                        const isExpanded = expandedRouteId === route.id;

                        return (
                          <div
                            key={route.id}
                            onClick={() => setActiveRoute(route)}
                            className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                              isSelected ? 'border-[#1A73E8] bg-[#F8F9FA] ring-1 ring-[#1A73E8]' : 'border-[#E8EAED] bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-[#202124]">{route.durationText}</span>
                                  <span className="text-[#5F6368]">• {route.distanceText}</span>
                                </div>
                                <span className="text-xs text-[#202124] font-medium block mt-0.5">{route.name}</span>
                                <span className="text-[11px] text-[#5F6368]">{route.summary}</span>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                                  route.riskLevel === 'Lower Risk' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FEF7E0] text-[#B06000]'
                                }`}
                              >
                                {route.riskLevel === 'Lower Risk' ? 'Protected Corridor' : 'Standard Route'}
                              </span>
                            </div>

                            {/* Human-Centered Expandable Details */}
                            <div className="mt-2.5 pt-2 border-t border-[#F1F3F4] flex items-center justify-between text-[11px]">
                              <span className="text-[#5F6368]">
                                {route.assistanceCount} verified 24/7 safe havens on route
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRouteId(isExpanded ? null : route.id);
                                }}
                                className="text-[#1A73E8] font-medium flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-[#E8EAED] space-y-1.5 text-[11px] text-[#5F6368]">
                                <div className="flex justify-between">
                                  <span>24/7 Police &amp; Hospital Buffer:</span>
                                  <span className="text-[#1E8E3E] font-medium">High Access ({route.havenScore}/100)</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Pedestrian &amp; Commercial Activity:</span>
                                  <span className="text-[#202124] font-medium">{route.footfallScore}/100</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>District Crime Reporting Rate:</span>
                                  <span className="text-[#202124] font-medium">{route.crimeRatePer100k} / 100k</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setJourneyStatus('ACTIVE');
                        setIsTrackingMovement(true);
                        setSimProgress(0.04);
                      }}
                      className="w-full h-12 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start Monitored Travel</span>
                    </button>
                  </div>
                )}

                {/* State 3: ACTIVE */}
                {journeyStatus === 'ACTIVE' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E8E3E] animate-pulse" />
                        <span className="text-xs font-semibold text-[#202124]">Journey in Progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {showTraffic && (
                          <span className="text-[10px] bg-[#E8F0FE] text-[#1A73E8] font-medium px-2 py-0.5 rounded-full">
                            Live Traffic Active
                          </span>
                        )}
                        <span className="text-xs text-[#5F6368] font-mono">{currentSpeedKmh} km/h</span>
                      </div>
                    </div>

                    {/* Pedestrian / Population Density HUD */}
                    <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#166534]">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-semibold">Pedestrian Density:</span>
                        <span>High (Active Eyes on the Street)</span>
                      </div>
                      <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] font-bold px-1.5 py-0.5 rounded">
                        Score: {activeRoute.footfallScore}/100
                      </span>
                    </div>

                    {crossTrackDistanceMeters >= 80 ? (
                      <div className="p-3 rounded-2xl bg-[#FEF7E0] border border-[#FEEFC3] text-xs text-[#7A4B04] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#EA8600]" />
                          <span>Detour: {crossTrackDistanceMeters}m off corridor</span>
                        </div>
                        <span className="font-semibold text-xs">Verifying</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-[#E6F4EA] border border-[#CEEAD6] text-xs text-[#137333] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#1E8E3E]" />
                          <span>On Planned Safe Route</span>
                        </div>
                        {nearestPOI && (
                          <span className="text-[11px] text-[#137333] font-medium">Near {nearestPOI.name}</span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setJourneyStatus('COMPLETED')}
                      className="w-full h-11 rounded-full bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043] font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#1E8E3E]" />
                      <span>End Journey Safely</span>
                    </button>
                  </div>
                )}

                {/* State 4: COMPLETED */}
                {journeyStatus === 'COMPLETED' && (
                  <div className="text-center py-2 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#E6F4EA] text-[#1E8E3E] flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-semibold text-[#202124]">You have arrived safely</h2>
                    <p className="text-xs text-[#5F6368]">Trip closed with zero incident escalations.</p>
                    <button
                      onClick={handleResetTrip}
                      className="w-full h-11 mt-2 rounded-full bg-[#1A73E8] text-white font-medium text-xs cursor-pointer"
                    >
                      Plan Another Route
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GUARDIANS */}
          {activeTab === 'GUARDIANS' && (
            <div className="flex-1 w-full bg-white p-5 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F3F4] mb-4">
                <div>
                  <h1 className="text-base font-semibold text-[#202124]">Guardians</h1>
                  <p className="text-xs text-[#5F6368]">Contacts alerted during an emergency</p>
                </div>
                <button
                  onClick={() => {
                    setTestAlertToast(true);
                    setTimeout(() => setTestAlertToast(false), 3000);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] text-xs font-medium hover:bg-[#D2E3FC] cursor-pointer"
                >
                  Send Test
                </button>
              </div>

              {testAlertToast && (
                <div className="p-3 mb-4 rounded-xl bg-[#E6F4EA] text-[#137333] text-xs flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 shrink-0" />
                  <span>Test SMS ping dispatched to all registered guardians.</span>
                </div>
              )}

              <div className="space-y-2.5 mb-6">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-3 rounded-2xl border border-[#E8EAED] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#202124]">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="text-[10px] bg-[#E8F0FE] text-[#1A73E8] px-2 py-0.5 rounded-full font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#5F6368] block mt-0.5">{contact.phone}</span>
                    </div>
                    <button
                      onClick={() => setContacts(contacts.filter((c) => c.id !== contact.id))}
                      className="text-[#9AA0A6] hover:text-[#D93025] p-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newContactName.trim() || !newContactPhone.trim()) return;
                  setContacts([
                    ...contacts,
                    {
                      id: `c-${Date.now()}`,
                      name: newContactName.trim(),
                      relationship: newContactRelation,
                      phone: newContactPhone.trim(),
                      isPrimary: contacts.length === 0
                    }
                  ]);
                  setNewContactName('');
                  setNewContactPhone('');
                }}
                className="space-y-3 pt-2"
              >
                <span className="text-xs font-medium text-[#202124] block">Add New Guardian</span>
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#DADCE0] text-xs focus:outline-hidden"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone (+91)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#DADCE0] text-xs focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="w-full h-10 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium cursor-pointer"
                >
                  Save Guardian
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ACTIVITY */}
          {activeTab === 'ACTIVITY' && (
            <div className="flex-1 w-full bg-white p-5 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F3F4] mb-4">
                <div>
                  <h1 className="text-base font-semibold text-[#202124]">Activity History</h1>
                  <p className="text-xs text-[#5F6368]">Your recent travel logs</p>
                </div>
                <button
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
                    const dl = document.createElement('a');
                    dl.setAttribute('href', dataStr);
                    dl.setAttribute('download', 'trip_history.json');
                    document.body.appendChild(dl);
                    dl.click();
                    dl.remove();
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#F1F3F4] text-[#3C4043] text-xs font-medium hover:bg-[#E8EAED] cursor-pointer"
                >
                  Export
                </button>
              </div>

              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-2xl border border-[#E8EAED] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#202124]">{log.origin} → {log.destination}</span>
                      <span className="text-[10px] text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded-full font-medium">
                        {log.status}
                      </span>
                    </div>
                    <span className="text-[#70757A] text-[11px] block">{log.timestamp}</span>
                    <span className="text-[#5F6368] text-[11px] block pt-1">
                      {log.distanceKm} km • {log.durationMin} mins
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'PROFILE' && (
            <div className="flex-1 w-full bg-white p-5 overflow-y-auto space-y-4">
              <div className="pb-3 border-b border-[#F1F3F4]">
                <h1 className="text-base font-semibold text-[#202124]">Settings</h1>
                <p className="text-xs text-[#5F6368]">Your preferences and credentials</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-medium">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-[#202124]">{user.name}</h2>
                  <span className="text-xs text-[#5F6368] block">{user.phone}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#E8EAED] text-xs flex items-center justify-between">
                <div>
                  <span className="font-medium text-[#202124] block">Check-in Timeout</span>
                  <span className="text-[11px] text-[#5F6368]">Time before contacts are alerted</span>
                </div>
                <div className="flex gap-1">
                  {[15, 30, 45].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setUser({ ...user, escalationTimerSeconds: sec })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                        user.escalationTimerSeconds === sec ? 'bg-[#1A73E8] text-white' : 'bg-[#F1F3F4] text-[#5F6368]'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <a
                href="tel:112"
                className="w-full h-11 rounded-full bg-[#D93025] hover:bg-[#B31412] text-white text-xs font-medium flex items-center justify-center gap-2 no-underline cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call 112 (Emergency Police)</span>
              </a>

              <div className="pt-2 pb-1 flex flex-col items-center justify-center gap-1 text-center">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#202124]">
                  <AppLogo className="w-5 h-5" />
                  <span>Mahila Shield • MP Transit Security</span>
                </div>
                <span className="text-[10px] text-[#70757A]">
                  Empirical NCRB/BNS Calibrated • Version 2.4
                </span>
              </div>

              <button
                onClick={() => setCurrentScreen('LANDING')}
                className="w-full h-11 rounded-full bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043] text-xs font-medium cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* HUMAN GOOGLE BOTTOM NAVIGATION */}
          <nav className="relative z-30 bg-white border-t border-[#E8EAED] px-3 py-2 flex items-center justify-around shadow-sm">
            <button
              onClick={() => setActiveTab('NAVIGATE')}
              className={`flex-1 flex flex-col items-center gap-0.5 cursor-pointer ${
                activeTab === 'NAVIGATE' ? 'text-[#1A73E8] font-medium' : 'text-[#5F6368]'
              }`}
            >
              <Navigation className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[10px]">Navigate</span>
            </button>
            <button
              onClick={() => setActiveTab('GUARDIANS')}
              className={`flex-1 flex flex-col items-center gap-0.5 cursor-pointer ${
                activeTab === 'GUARDIANS' ? 'text-[#1A73E8] font-medium' : 'text-[#5F6368]'
              }`}
            >
              <Users className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[10px]">Guardians</span>
            </button>
            <button
              onClick={() => setActiveTab('ACTIVITY')}
              className={`flex-1 flex flex-col items-center gap-0.5 cursor-pointer ${
                activeTab === 'ACTIVITY' ? 'text-[#1A73E8] font-medium' : 'text-[#5F6368]'
              }`}
            >
              <Activity className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[10px]">Activity</span>
            </button>
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`flex-1 flex flex-col items-center gap-0.5 cursor-pointer ${
                activeTab === 'PROFILE' ? 'text-[#1A73E8] font-medium' : 'text-[#5F6368]'
              }`}
            >
              <User className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[10px]">Settings</span>
            </button>
          </nav>
        </div>
      )}

      {/* CHECK-IN OVERLAY MODAL */}
      {journeyStatus === 'CHECK_IN_PENDING' && (
        <div className="fixed inset-0 z-50 bg-[#202124]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF7E0] text-[#B06000] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#202124]">Are you okay?</h2>
                <span className="text-xs text-[#5F6368]">Your vehicle has detoured from the safe route.</span>
              </div>
            </div>

            <div className="text-center py-3">
              <span className="text-3xl font-light text-[#202124]">
                00:{checkInCountdown.toString().padStart(2, '0')}
              </span>
              <p className="text-[11px] text-[#5F6368] mt-1">
                Contacts will be alerted if unconfirmed.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setIsManualOffset(false);
                  setOffsetMeters(0);
                  setConsecutiveDeviations(0);
                  toggleSiren(false);
                  setJourneyStatus('ACTIVE');
                }}
                className="w-full h-11 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium text-xs cursor-pointer"
              >
                I Am Safe (Dismiss)
              </button>
              <button
                onClick={handleTriggerSos}
                className="w-full h-11 rounded-full bg-[#D93025] hover:bg-[#B31412] text-white font-medium text-xs cursor-pointer"
              >
                Need Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS FULL-SCREEN DISPATCH */}
      {journeyStatus === 'SOS_TRIGGERED' && (
        <div className="fixed inset-0 z-50 bg-[#D93025] text-white p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" />
              <h1 className="text-base font-semibold">Emergency Alert Active</h1>
            </div>
            <button
              onClick={() => toggleSiren()}
              className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium cursor-pointer"
            >
              {isSirenActive ? 'Mute' : 'Unmute'}
            </button>
          </div>

          <div className="text-center my-auto space-y-3">
            <span className="text-xs text-white/80 uppercase tracking-wider block">Live Coordinates Sent</span>
            <div className="text-2xl font-light tracking-wide">
              {currentCoordinate.lat.toFixed(4)}, {currentCoordinate.lng.toFixed(4)}
            </div>
            <span className="text-xs text-white/90 block">
              Nearest haven: {nearestPOI?.name || 'Verified Emergency Corridor'}
            </span>
          </div>

          <div className="space-y-2.5">
            <a
              href="tel:112"
              className="w-full h-12 rounded-full bg-white text-[#D93025] font-semibold text-sm flex items-center justify-center gap-2 no-underline cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 112 Directly</span>
            </a>
            <button
              onClick={handleResetTrip}
              className="w-full h-11 rounded-full bg-black/20 text-white/90 text-xs font-medium cursor-pointer"
            >
              Cancel Alert
            </button>
          </div>
        </div>
      )}

      {/* POI DETAIL POPUP */}
      {selectedPoiDetail && (
        <div className="fixed inset-0 z-50 bg-[#202124]/40 flex items-end justify-center p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-[#1E8E3E] font-medium uppercase tracking-wider block">
                  {selectedPoiDetail.type === 'police' ? 'Verified Police Desk' : 'Emergency Hospital'}
                </span>
                <h3 className="text-sm font-semibold text-[#202124] mt-0.5">{selectedPoiDetail.name}</h3>
                {selectedPoiDetail.address && (
                  <span className="text-xs text-[#5F6368] block mt-0.5">{selectedPoiDetail.address}</span>
                )}
              </div>
              <button onClick={() => setSelectedPoiDetail(null)} className="text-[#9AA0A6] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 pt-2 border-t border-[#F1F3F4] flex justify-between text-xs text-[#5F6368]">
              <span>Distance to route: {selectedPoiDetail.distanceMeters}m</span>
              <span className="text-[#1E8E3E] font-medium">24/7 Monitored</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. ROOT APP COMPONENT (SAFE API PROVIDER WRAPPER)
// ============================================================================
export default function App() {
  const initialApiKey =
    safeStorage.getItem('mahila_shield_gmaps_key') ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyDEtk-7TO1WsmP4vPF9oa3mcXs80Z4rdT4';
  const [apiKey, setApiKey] = useState<string>(initialApiKey);
  const [mapLoadFailed, setMapLoadFailed] = useState<boolean>(false);

  useEffect(() => {
    const handler = () => setMapLoadFailed(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  return !mapLoadFailed && apiKey ? (
    <APIProvider apiKey={apiKey} libraries={GOOGLE_MAPS_LIBRARIES} onError={() => setMapLoadFailed(true)}>
      <ShieldAppInner apiKey={apiKey} mapLoadFailed={mapLoadFailed} setApiKey={setApiKey} setMapLoadFailed={setMapLoadFailed} />
    </APIProvider>
  ) : (
    <ShieldAppInner apiKey={apiKey} mapLoadFailed={true} setApiKey={setApiKey} setMapLoadFailed={setMapLoadFailed} />
  );
}

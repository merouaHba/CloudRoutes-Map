import L from "leaflet";
import busStopSvg from "./assets/bus-stop-simple.svg?raw";

// Simple, clean bus stop icon
export const busStopIcon = L.divIcon({
  className: "custom-bus-stop-icon",
  html: busStopSvg,
  iconSize: new L.Point(50, 50),
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
});

export const busIcon = (name: string, angle: number) =>
  L.divIcon({
    className: "bus-icon",
    html: `<div class="bus-icon-container">
        <div class="bus-name">${name}</div>
          <div class="bus-direction" style="--angle: ${angle}deg;">
            <svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Main circle -->
              <circle cx="24" cy="34" r="20" fill="white" stroke="#0c4a6e" stroke-width="2.5"/>
              
              <!-- Bus icon -->
              <path d="M24 22C28.5 22 31.5 23.125 31.5 24.625V25.125V26.25C32.0523 26.25 32.5 26.6977 32.5 27.25V29.25C32.5 29.8023 32.0523 30.25 31.5 30.25V35.5C31.5 36.0523 31.0523 36.5 30.5 36.5V37.5C30.5 38.0523 30.0523 38.5 29.5 38.5H28.5C27.9477 38.5 27.5 38.0523 27.5 37.5V36.5H20.5V37.5C20.5 38.0523 20.0477 38.5 19.5 38.5H18.5C17.9477 38.5 17.5 38.0523 17.5 37.5V36.5C16.9477 36.5 16.5 36.0523 16.5 35.5V30.25C15.9477 30.25 15.5 29.8023 15.5 29.25V27.25C15.5 26.6977 15.9477 26.25 16.5 26.25V25.125V24.625C16.5 23.125 19.5 22 24 22ZM18.5 27.25V30.25C18.5 30.8023 18.9477 31.25 19.5 31.25H23V26.25H19.5C18.9477 26.25 18.5 26.6977 18.5 27.25ZM24.5 31.25H28.5C29.0523 31.25 29.5 30.8023 29.5 30.25V27.25C29.5 26.6977 29.0523 26.25 28.5 26.25H24.5V31.25ZM19.625 35C19.8904 35 20.1446 34.8946 20.3321 34.7071C20.5196 34.5196 20.625 34.2654 20.625 34C20.625 33.7346 20.5196 33.4804 20.3321 33.2929C20.1446 33.1054 19.8904 33 19.625 33C19.3596 33 19.1054 33.1054 18.9179 33.2929C18.7304 33.4804 18.625 33.7346 18.625 34C18.625 34.2654 18.7304 34.5196 18.9179 34.7071C19.1054 34.8946 19.3596 35 19.625 35ZM28.375 35C28.6404 35 28.8946 34.8946 29.0821 34.7071C29.2696 34.5196 29.375 34.2654 29.375 34C29.375 33.7346 29.2696 33.4804 29.0821 33.2929C28.8946 33.1054 28.6404 33 28.375 33C28.1096 33 27.8554 33.1054 27.6679 33.2929C27.4804 33.4804 27.375 33.7346 27.375 34C27.375 34.2654 27.4804 34.5196 27.6679 34.7071C27.8554 34.8946 28.1096 35 28.375 35ZM27.5 24.625C27.5 24.3467 27.2761 24.125 27 24.125H21C20.7239 24.125 20.5 24.3467 20.5 24.625C20.5 24.9033 20.7239 25.125 21 25.125H27C27.2761 25.125 27.5 24.9033 27.5 24.625Z" fill="#0c4a6e"/>
              
              <!-- Direction arrow -->
              <path d="M24 8L20.5 14L24 12.8333L27.5 14L24 8Z" stroke="#0c4a6e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
         </div>
      `,
    iconSize: new L.Point(48, 56),
    iconAnchor: [24, 56],
    popupAnchor: [0, -56],
  });

export const userIcon = () => {
  return L.divIcon({
    className: "user-location-icon",
    html: `
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Main circle -->
        <circle cx="24" cy="24" r="20" fill="url(#userGradient)"/>
        
        <!-- Inner white circle -->
        <circle cx="24" cy="24" r="16" fill="white"/>
        
        <!-- Location dot -->
        <circle cx="24" cy="24" r="7" fill="url(#userGradient)"/>
        
        <!-- Direction arrow -->
        <path d="M30.0641 31.7983C30.6395 31.9901 31.1749 31.4184 30.9457 30.8567L24.6573 15.4417C24.417 14.8528 23.583 14.8528 23.3427 15.4417L17.0543 30.8567C16.8251 31.4184 17.3605 31.9901 17.936 31.7983L23.7755 29.8517C23.9212 29.8032 24.0788 29.8032 24.2245 29.8517L30.0641 31.7983Z" fill="white"/>
        
        <!-- Pulse animation circle -->
        <circle cx="24" cy="24" r="20" fill="none" stroke="url(#userGradient)" stroke-width="2" opacity="0.5">
          <animate attributeName="r" from="20" to="26" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <defs>
          <linearGradient id="userGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
        </defs>
      </svg>
    `,
    iconSize: new L.Point(48, 48),
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

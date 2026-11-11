import { MOTION_ATTRIBUTE, MOTION_STORAGE_KEY } from './appearance.rules'

/**
 * Runs in <head> before the first paint: applies the own "Bewegung reduzieren" choice so no
 * motion slips through on load. The colour scheme is set the same way by next-themes (EC-1).
 * The code is a fixed string without any user input.
 */
export const APPEARANCE_SCRIPT = `(function(){try{if(window.localStorage.getItem(${JSON.stringify(
  MOTION_STORAGE_KEY
)})==='on'){document.documentElement.setAttribute(${JSON.stringify(MOTION_ATTRIBUTE)},'true')}}catch(e){}})();`

export function AppearanceScript() {
  return <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
}

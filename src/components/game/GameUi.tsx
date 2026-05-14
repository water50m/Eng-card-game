"use client"

import { motion } from "framer-motion"
import type React from "react"

export function Label({ children }:{ children:React.ReactNode }) {
  return <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase" as const,letterSpacing:"0.07em",margin:"0 0 8px"}}>{children}</p>
}
export function Chip({ children }:{ children:React.ReactNode }) {
  return <span style={{padding:"3px 9px",borderRadius:"9999px",background:"var(--bg-subtle)",border:"1px solid var(--border-default)",fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)"}}>{children}</span>
}
export function Toggle({ on, onToggle }:{ on:boolean; onToggle:()=>void }) {
  return (
    <button onClick={onToggle} style={{width:"42px",height:"22px",borderRadius:"9999px",border:"none",cursor:"pointer",position:"relative",background:on?"var(--accent-primary)":"var(--border-strong)",transition:"background 0.2s",flexShrink:0}}>
      <motion.div animate={{x:on?19:2}} transition={{type:"spring",stiffness:500,damping:30}}
        style={{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px"}}/>
    </button>
  )
}

import { useAudioPlayerAtomSelector } from "@renderer/atoms/player"
import { setUpdaterStatus, useUpdaterStatus } from "@renderer/atoms/updater"
import { softBouncePreset } from "@renderer/components/ui/constants/spring"
import { tipcClient } from "@renderer/lib/client"
import { cn } from "@renderer/lib/utils"
import { handlers } from "@renderer/tipc"
import { m, useMotionTemplate, useMotionValue } from "framer-motion"
import { useCallback, useEffect } from "react"

export const AutoUpdater = () => {
  const updaterStatus = useUpdaterStatus()

  useEffect(() => {
    const unlisten = handlers?.updateDownloaded.listen(() => {
      setUpdaterStatus(true)
    })
    return unlisten
  }, [])

  const handleClick = useCallback(() => {
    setUpdaterStatus(false)
    window.posthog?.capture("update_restart")

    tipcClient?.quitAndInstall()
  }, [])

  const playerIsShow = useAudioPlayerAtomSelector((s) => s.show)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const radius = useMotionValue(0)
  const handleMouseMove = useCallback(
    ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
      const bounds = currentTarget.getBoundingClientRect()
      mouseX.set(clientX - bounds.left)
      mouseY.set(clientY - bounds.top)
      radius.set(Math.hypot(bounds.width, bounds.height) * 1.3)
    },
    [mouseX, mouseY, radius],
  )

  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, var(--a) 0%, transparent 65%)`

  if (!updaterStatus) return null

  return (
    <m.div
      onMouseMove={handleMouseMove}
      className={cn(
        "group absolute inset-x-3 bottom-3 cursor-pointer overflow-hidden rounded-lg bg-theme-modal-background py-3 text-center text-sm shadow backdrop-blur",
        playerIsShow && "bottom-28",
      )}
      onClick={handleClick}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={softBouncePreset}
    >
      <m.div
        layout
        className="absolute inset-0 opacity-0 duration-500 group-hover:opacity-5"
        style={
          {
            background,
          } as any
        }
      />
      <div className="font-medium">{APP_NAME} is ready to update!</div>
      <div className="text-xs text-zinc-500">Click to restart</div>
    </m.div>
  )
}

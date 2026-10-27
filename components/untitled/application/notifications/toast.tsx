"use client"

import { AlertCircle, CheckCircle } from "@untitledui/icons"
import { Toaster as SonnerToaster, toast as sonner } from "sonner"
import { CloseButton } from "@/components/untitled/base/buttons/close-button"
import { cx } from "@/utils/cx"
import { FeaturedIcon } from "@/components/untitled/foundations/featured-icon/featured-icon"

/** Toasts.
 *
 * Untitled UI's notifications component is PRO-only, so this is built from its
 * free parts and follows its design: a white card with a hairline ring and a
 * large shadow, a light featured icon, a semibold title over a tertiary
 * description, and a close button. Sonner supplies the stacking, timing and
 * swipe-away, as it does in Untitled UI's own kit.
 */

type Tone = "success" | "error"

function Notification({
  title,
  description,
  tone,
  onClose,
}: {
  title: string
  description?: string
  tone: Tone
  onClose: () => void
}) {
  return (
    <div
      role="status"
      className={cx(
        "relative flex w-[min(24rem,calc(100vw-2rem))] gap-3 rounded-xl bg-primary_alt p-4 shadow-lg ring-1 ring-secondary_alt",
        // With no description the text is one line, so centre it against the icon.
        description ? "items-start" : "items-center"
      )}
    >
      <FeaturedIcon
        icon={tone === "error" ? AlertCircle : CheckCircle}
        color={tone}
        theme="light"
        size="md"
      />
      <div className={cx("min-w-0 flex-1 pr-6", description && "pt-0.5")}>
        <p className="text-sm font-semibold text-primary">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-tertiary">{description}</p>
        )}
      </div>
      <CloseButton
        size="xs"
        slot={null}
        className={cx(
          "absolute right-2",
          description ? "top-2" : "top-1/2 -translate-y-1/2"
        )}
        onPress={onClose}
      />
    </div>
  )
}

/** Shows a toast. Success by default; pass `tone: "error"` for a refusal. */
export function toast({
  title,
  description,
  tone = "success",
}: {
  title: string
  description?: string
  tone?: Tone
}) {
  sonner.custom(
    (id) => (
      <Notification
        title={title}
        description={description}
        tone={tone}
        onClose={() => sonner.dismiss(id)}
      />
    ),
    { duration: tone === "error" ? 6000 : 4000 }
  )
}

/** Mount once, near the root. */
export function Toaster() {
  return <SonnerToaster position="bottom-right" />
}

import { Button } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { from } from "dnum"
import { AnimatePresence, m } from "framer-motion"
import { useCallback, useState } from "react"

import { softSpringPreset } from "~/components/ui/constants/spring"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useI18n } from "~/hooks/common"
import { useBoostFeedMutation, useBoostStatusQuery } from "~/modules/boost/query"
import { useWallet } from "~/queries/wallet"

import { BoostProgress } from "./boost-progress"
import { BoostingContributors } from "./boosting-contributors"
import { LevelBenefits } from "./level-benefits"
import { RadioCards } from "./radio-cards"

export const BoostModalContent = ({ feedId }: { feedId: string }) => {
  const t = useI18n()
  const myWallet = useWallet()
  const myWalletData = myWallet.data?.[0]

  const dPowerBigInt = BigInt(myWalletData?.dailyPowerToken ?? 0)
  const cPowerBigInt = BigInt(myWalletData?.cashablePowerToken ?? 0)
  const balanceBigInt = cPowerBigInt + dPowerBigInt
  const [amount, setAmount] = useState<number>(0)
  const amountBigInt = from(amount, 18)[0]
  const wrongNumberRange = amountBigInt > balanceBigInt || amountBigInt <= BigInt(0)

  const { data: boostStatus, isLoading } = useBoostStatusQuery(feedId)
  const boostFeedMutation = useBoostFeedMutation()
  const { dismiss } = useCurrentModal()

  const handleBoost = useCallback(() => {
    if (boostFeedMutation.isPending) return
    boostFeedMutation.mutate({ feedId, amount: amountBigInt.toString() })
  }, [amountBigInt, boostFeedMutation, feedId])

  if (isLoading || !boostStatus) {
    return (
      <div className="center pointer-events-none grow -translate-y-16">
        <LoadingWithIcon icon={<i className="i-mgc-rocket-cute-fi" />} size="large" />
      </div>
    )
  }

  return (
    <div className="flex w-[80vw] max-w-[350px] flex-col gap-3">
      <div className="relative flex w-full grow flex-col items-center gap-3">
        <div className="mt-4 text-xl font-bold">
          <i className="i-mgc-rocket-cute-fi mr-1.5 text-lg" />
          {t("boost.boost_feed")}
        </div>

        <small className="center mt-1 gap-1 text-theme-vibrancyFg">
          {t("boost.boost_feed_description")}
        </small>

        <BoostProgress {...boostStatus} />

        <AnimatePresence>
          {!boostFeedMutation.isSuccess && (
            <RadioCards
              monthlyBoostCost={boostStatus.monthlyBoostCost}
              value={amount}
              onValueChange={setAmount}
            />
          )}
        </AnimatePresence>
      </div>

      {boostFeedMutation.isSuccess ? (
        <>
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={softSpringPreset}>
            {t("boost.boost_success_thanks")}
          </m.p>
          <Button variant="primary" onClick={() => dismiss()}>
            {t.common("close")}
          </Button>
        </>
      ) : (
        <Button
          disabled={boostFeedMutation.isSuccess || boostFeedMutation.isPending || wrongNumberRange}
          isLoading={boostFeedMutation.isPending}
          variant="primary"
          onClick={handleBoost}
        >
          <i className="i-mgc-rocket-cute-fi mr-2 shrink-0" />
          {t("words.boost")}
        </Button>
      )}

      <BoostingContributors feedId={feedId} />
      <LevelBenefits />
    </div>
  )
}
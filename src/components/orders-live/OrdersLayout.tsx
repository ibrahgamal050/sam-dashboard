// src/components/dashboard/orders-live/OrdersLayout.tsx
"use client"

import { useCallback, useState } from "react"
import { getDirection, Locale } from "@/lib/locale"

import OrdersSidebar from "./OrdersSidebar"
import OrdersDetailsPane from "./OrdersDetailsPane"
import MobileOrderDetails from "./MobileOrderDetails"
import OrdersHeader from "./OrdersHeader"

import { useLiveOrders } from "./hooks/useLiveOrders"
import { STRINGS } from "./i18n"

export default function OrdersLayout({ restaurantSlug }: { restaurantSlug: string }) {
  const [lang, setLang] = useState<Locale>("ar")
  const direction = getDirection(lang)
  const strings = STRINGS[lang] ?? STRINGS.en

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    restaurantName,
    displayOrders,
    selectedOrder,
    selectedOrderId,
    setSelectedOrderId,
    isDetailsOpen,
    setIsDetailsOpen,
    autoAccept,
    setAutoAccept,
    muteAutoAccepted,
    setMuteAutoAccepted,
    searchTerm,
    setSearchTerm,
    pendingActions,
    handleStatusChange,
    selectedStatus,
    isReadOnly,
  } = useLiveOrders({ restaurantSlug, lang })

  const handleOpenAllOrders = useCallback(() => {
    if (typeof window === "undefined") return
    const slug = data?.restaurant?.subdomain ?? restaurantSlug ?? ""
    const href = slug ? `/dashboard/${slug}/orders` : "/dashboard/orders"
    window.open(href, "_blank", "noopener,noreferrer")
  }, [data?.restaurant?.subdomain, restaurantSlug])

  const handleRefresh = useCallback(() => {
    void mutate()
  }, [mutate])

  if (!restaurantSlug) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground" lang={lang} dir={direction}>
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-foreground">{strings.noRestaurantTitle}</h2>
          <p className="text-sm">{strings.noRestaurantSubtitle}</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground" lang={lang} dir={direction}>
        <div className="max-w-sm space-y-3 text-center">
          <h2 className="text-lg font-semibold text-foreground">{strings.errorTitle}</h2>
          <p className="text-sm">{error instanceof Error ? error.message : strings.failedBadge}</p>
          <button onClick={() => mutate()} className="underline">
            {strings.tryAgain}
          </button>
        </div>
      </div>
    )
  }

return (
  <div className="h-screen overflow-hidden bg-[#E6E6E6]" lang={lang} dir={direction}>
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-4 p-3">
      {/* Header ثابت */}
      <OrdersHeader
        brandName={restaurantName ?? strings.fallbackTitle}
        lang={lang}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        isMuted={muteAutoAccepted}
        onToggleMute={isReadOnly ? undefined : () => setMuteAutoAccepted((p) => !p)}
        onRefresh={handleRefresh}
        isOnline={autoAccept}
        onToggleOnline={isReadOnly ? undefined : (v) => setAutoAccept(v)}
        onOpenAllOrders={handleOpenAllOrders}
        allOrdersLabel="عرض كل الطلبات"
      />

      {/* Body ياخد باقي الشاشة */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Sidebar ثابت */}
        <OrdersSidebar
          className="h-full"
          lang={lang}
          setLang={setLang}
          direction={direction}
          strings={strings}
          restaurantName={restaurantName ?? strings.fallbackTitle}
          subdomain={data?.restaurant?.subdomain}
          isLoading={isLoading && !data}
          isValidating={isValidating}
          mutate={handleRefresh}
          autoAccept={autoAccept}
          setAutoAccept={setAutoAccept}
          muteAutoAccepted={muteAutoAccepted}
          setMuteAutoAccepted={setMuteAutoAccepted}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          orders={displayOrders}
          selectedOrderId={selectedOrderId}
          onSelectOrder={(id) => {
            setSelectedOrderId(id)
            if (typeof window !== "undefined" && window.innerWidth < 768) setIsDetailsOpen(true)
          }}
          pendingActions={pendingActions}
          onAction={handleStatusChange}
          readOnly={isReadOnly}
        />

        {/* Main ثابت */}
        <OrdersDetailsPane
          className="h-full"
          lang={lang}
          direction={direction}
          strings={strings}
          selectedOrder={selectedOrder}
          selectedStatus={selectedStatus}
          mutate={handleRefresh}
          pendingActions={pendingActions}
          onAction={handleStatusChange}
          readOnly={isReadOnly}
        />
      </div>
    </div>

    <MobileOrderDetails
      open={isDetailsOpen}
      onClose={() => setIsDetailsOpen(false)}
      lang={lang}
      direction={direction}
      selectedOrder={selectedOrder}
      selectedStatus={selectedStatus}
      mutate={handleRefresh}
      pendingActions={pendingActions}
      onAction={handleStatusChange}
      readOnly={isReadOnly}
    />
  </div>
)

}

export default function StylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { stylist, loading } = useStylistDetail(id);

  const [activeTab, setActiveTab] = useState("about");
  const [bookingModal, setBookingModal] = useState({ open: false, service: null });

  if (loading) return <Skeleton />;
  if (!stylist) return <NotFound />;

  const services = safeServices(stylist.services);
  const minPrice = getMinPrice(services);

  return (
    <div>
      <HeroSection stylist={stylist} />

      <StickyTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="layout">
        {activeTab === "about" && <AboutSection />}
        {activeTab === "services" && (
          <ServicesTab
            services={services}
            onBook={(s) => setBookingModal({ open: true, service: s })}
            stylistId={id!}
          />
        )}
        {activeTab === "reviews" && <ReviewsTab stylist={stylist} />}
      </div>

      <BookingCard
        stylist={stylist}
        services={services}
        minPrice={minPrice}
        onBook={() => setBookingModal({ open: true, service: null })}
      />
    </div>
  );
}
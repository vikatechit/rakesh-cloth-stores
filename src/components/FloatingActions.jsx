import { useStore } from '../context/StoreContext';

export default function FloatingActions() {
  const { storeSettings } = useStore();
  const wa = storeSettings.whatsapp_number || '919985728175';

  return (
    <aside className="floating-action-cluster">
      <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="float-btn float-wa-graphic" title="Chat on WhatsApp">
        <img src="/whatsapp-icon.png" alt="WhatsApp" className="float-wa-icon-img" />
      </a>
    </aside>
  );
}

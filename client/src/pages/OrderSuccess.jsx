import { Link } from 'react-router-dom'
function OrderSuccess() { return <section className="container page-section empty-state"><p className="eyebrow">NEXORA</p><h1>Order confirmed</h1><p className="status-message">Your order has been received.</p><Link className="button" to="/orders">View my orders</Link></section> }
export default OrderSuccess
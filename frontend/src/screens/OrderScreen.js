import { React, useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Row, Col, ListGroup, Image, Card } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { Link } from 'react-router-dom'
import {
	getOrderDetails,
	payOrder,
	deliverOrder,
} from '../actions/orderActions'
import { PayPalButton } from 'react-paypal-button-v2'
import {
	ORDER_PAY_RESET,
	ORDER_DELIVERED_RESET,
} from '../constants/orderContants'

const OrderScreen = () => {
	const cart = useSelector(state => state.cart)
	const [sdkReady, setSdkReady] = useState(false)
	const dispatch = useDispatch()
	const params = useParams()

	const orderId = params.id

	const addDecimals = num => {
		return (Math.round(num * 100) / 100).toFixed(2)
	}

	// Calculate prices
	cart.itemsPrice = addDecimals(
		Number(
			cart.cartItems.reduce(
				(acc, item) => acc + item.price * item.qty,
				0
			)
		).toFixed(2)
	)

	const userLogin = useSelector(state => state.userLogin)
	const { userInfo } = userLogin

	const orderDetails = useSelector(state => state.orderDetails)
	const { order, loading, error } = orderDetails

	const orderPay = useSelector(state => state.orderPay)
	const { loading: loadingPay, success: successpay } = orderPay

	const orderDeliver = useSelector(state => state.orderDeliver)
	const {
		loading: loadingDeliver,
		success: successDeliver,
		error: errorDeliver,
	} = orderDeliver

	if (!loading) {
		// Calculate prices
		order.itemsPrice = addDecimals(
			Number(
				order.orderItems.reduce(
					(acc, item) => acc + item.price * item.qty,
					0
				)
			).toFixed(2)
		)
	}

	cart.shippingPrice = addDecimals(cart.itemPrice > 100 ? 0 : 100)
	cart.taxPrice = addDecimals(Number((0.15 * cart.itemsPrice).toFixed(2)))
	cart.totalPrice = (
		Number(cart.itemsPrice) +
		Number(cart.itemsPrice) +
		Number(cart.itemsPrice)
	).toFixed(2)

	const successPayment = paymentResult => {
		console.log(paymentResult)
		dispatch(payOrder(orderId, paymentResult))
	}

	useEffect(() => {
		const addPaypalScript = async () => {
			const { data: clientId } = await axios.get('/api/config/paypal')
			const script = document.createElement('script')
			script.type = 'text/javascript'
			script.async = true
			script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`
			script.onload = () => {
				setSdkReady(true)
			}
			document.body.appendChild(script)
		}
		if (!order || successpay || successDeliver) {
			dispatch({ type: ORDER_PAY_RESET })
			dispatch({ type: ORDER_DELIVERED_RESET })
			dispatch(getOrderDetails(orderId))
		} else if (!order.isPaid) {
			if (!window.paypal) {
				console.log('script adding ...')
				addPaypalScript()
				console.log('script added ...')
			} else {
				setSdkReady(true)
			}
		}
	}, [dispatch, order, orderId, successpay, successDeliver])

	const deliverHandler = () => {
		dispatch(deliverOrder(order))
	}

	return loading ? (
		<Loader />
	) : error ? (
		<Message variant='danger'>{error}</Message>
	) : (
		<>
			<h1>Order {order._id}</h1>
			<Row>
				<Col md={8}>
					<ListGroup variant='flsuh'>
						<ListGroup.Item>
							<h2>Shipping</h2>
							<p>
								<strong>Name: </strong>{' '}
								{order.user.name}
							</p>
							<p>
								<strong>Email: </strong>{' '}
								<a href={`mailto:${order.user.email}`}>
									{order.user.email}
								</a>
							</p>
							<p>
								<strong>Address </strong>
								{order.shippingAddress.address},{' '}
								{order.shippingAddress.city},{' '}
								{order.shippingAddress.postalCode},{' '}
								{order.shippingAddress.country}
							</p>
							{order.isDelivered ? (
								<Message variant='success'>
									Delivered on {order.deliveredAt}
								</Message>
							) : (
								<Message variant='danger'>
									Not Delivered
								</Message>
							)}
						</ListGroup.Item>
						<ListGroup.Item>
							<h2>Payment Method</h2>
							<p>
								<strong>Method: </strong>
								{order.paymentMethod}
							</p>
							{order.isPaid ? (
								<Message variant='success'>
									Paid on {order.paidAt}
								</Message>
							) : (
								<Message variant='danger'>
									Not paid
								</Message>
							)}
						</ListGroup.Item>
						<ListGroup.Item>
							<h2>Order Items</h2>

							{!order ? (
								<Message>Order is Empty.</Message>
							) : (
								<ListGroup variant='flush'>
									{order.orderItems.map(
										(item, index) => (
											<ListGroup.Item
												key={index}>
												<Row>
													<Col md={1}>
														<Image
															src={
																item.image
															}
															alt={
																item.name
															}
															fluid
															rounded
														/>
													</Col>
													<Col>
														<Link
															to={`/product/${item.product}`}>
															{
																item.name
															}
														</Link>
													</Col>
													<Col md={4}>
														{item.qty}{' '}
														x $
														{
															item.price
														}{' '}
														= $
														{item.qty *
															item.price}
													</Col>
												</Row>
											</ListGroup.Item>
										)
									)}
								</ListGroup>
							)}
						</ListGroup.Item>
					</ListGroup>
				</Col>
				<Col md={4}>
					<Card>
						<ListGroup variant='flush'>
							<ListGroup.Item>
								<h2>Order Summary</h2>
							</ListGroup.Item>
							<ListGroup.Item>
								<Row>
									<Col>Items</Col>
									<Col>${order.itemsPrice}</Col>
								</Row>
							</ListGroup.Item>

							<ListGroup.Item>
								<Row>
									<Col>Shipping</Col>
									<Col>${order.shippingPrice}</Col>
								</Row>
							</ListGroup.Item>
							<ListGroup.Item>
								<Row>
									<Col>Tax</Col>
									<Col>${order.taxPrice}</Col>
								</Row>
							</ListGroup.Item>
							<ListGroup.Item>
								<Row>
									<Col>Total</Col>
									<Col>${order.totalPrice}</Col>
								</Row>
							</ListGroup.Item>
							{!order.isPaid && (
								<ListGroup.Item>
									{loadingPay && <Loader />}
									{!sdkReady ? (
										<Loader />
									) : (
										<PayPalButton
											amount={order.totalPrice}
											onSuccess={
												successPayment
											}
										/>
									)}
								</ListGroup.Item>
							)}
							{errorDeliver && (
								<Message variant='danger'>
									{errorDeliver}
								</Message>
							)}
							{loadingDeliver && <Loader />}
							{userInfo.isAdmin &&
								order.isPaid &&
								!order.isDelivered && (
									<ListGroup.Item>
										<Button
											type='button'
											className='btn btn-black'
											onClick={deliverHandler}>
											Mark as Delivered
										</Button>
									</ListGroup.Item>
								)}
						</ListGroup>
					</Card>
				</Col>
			</Row>
		</>
	)
}

export default OrderScreen

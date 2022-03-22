import Link from "next/link"

import { Fragment, useState, useEffect } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { BellIcon, MenuIcon, XIcon } from '@heroicons/react/outline'
import {logo} from '../public/Fundraiser.svg'

import { ethers, providers } from "ethers"

import useSWR from "swr"

const navigation = [
  { name: 'About', href: '/about', current: true },
  { name: 'Fund Projects', href: '/fund', current: false },
  { name: 'Start Project', href: '/start', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
	const [account, setAccount] = useState(null)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	
	const checkWalletConnected = async () => {
		const { ethereum } = window
		
		if(!ethereum) {
			console.log('Install Metamask')
			return
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' })

		if(accounts.length !== 0) {
			const account = accounts[0]
			console.log("Found Account, ", account)
			let provider = new ethers.providers.Web3Provider(window.ethereum)
			let network = await provider.getNetwork()
			setAccount(account)
			if(network.name !==  "maticmum") {
				alert("not connected to polygon mumbai testnet, please change the network to polygon mumbai testnet ")
			}
			else {
				console.log('maticmum connected');
				
			}
		} else {
			console.log("Create a Ethereum Account")
		}
	}

	const login = async () => {
		try {
			const { ethereum } = window
		
			if(!ethereum) {
				console.log("Install Metamask")
				return
			}
		
			const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
			
			console.log("Connected, ", accounts[0])
			setAccount(accounts[0])
			setIsAuthenticated(true)
		} catch (e) {
			console.log(e)
		}
	}

	useEffect(checkWalletConnected, [])
	useEffect(login, [])

	useEffect(() => {
		console.log(account)
	}, [account])

	return (
		<Disclosure as="nav" className="bg-white glass sticky top-0 z-50 w-full bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-60 border border-opacity-0">
			{({ open }) => (
				<>
				<div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
					<div className="relative flex items-center justify-between h-16">
					<div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
						{/* Mobile menu button*/}
						<Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-black hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
						<span className="sr-only">Open main menu</span>
						{open ? (
							<XIcon className="block h-6 w-6" aria-hidden="true" />
						) : (
							<MenuIcon className="block h-6 w-6" aria-hidden="true" />
						)}
						</Disclosure.Button>
					</div>
					<div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
						<div className="flex-shrink-0 flex items-center">
							<Link href='/'>
								<h1 className=" text-black px-3 rounded-md text-xl cursor-pointer font-logo "> <img src="https://gateway.pinata.cloud/ipfs/QmVEVCTC4StrJWTPPA1wJfLgZMkC9p7fpSspHUtmprncyi" width={90} alt="" /> </h1>
								{/* <h1 className="font-inter text-black px-3 rounded-md text-xl cursor-pointer font-logo font-semibold"> Light  </h1> */}
							</Link>
						</div>
					</div>
					<div className="flex">
						<div className="hidden sm:block sm:ml-6 sm:mr-6">
							<div className="flex space-x-4">
								{navigation.map((item) => (
									<Link
										key={item.name}
										href={item.href}
										aria-current={item.current ? 'page' : undefined}
									>
										<a 
											className={classNames(
											item.current ? 'hover:bg-gray-700 hover:text-white' : 'text-black hover:bg-gray-700 hover:text-white',
											'px-3 py-2 rounded-md text-sm font-medium'
										)}>
											{item.name}
										</a>
									</Link>
								))}
							</div>
						</div>
						{isAuthenticated ? <div className="bg-green-500 text-white px-3 py-2 rounded-md text-sm cursor-pointer font-medium hover:green-700">Connected</div> : <div className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-900" onClick={login}>Connect Wallet</div>}
					</div>
					</div>
				</div>

				<Disclosure.Panel className="sm:hidden">
					<div className="px-2 pt-2 pb-3 space-y-1">
					{navigation.map((item) => (
						<Disclosure.Button
						key={item.name}
						as="a"
						href={item.href}
						className={classNames(
							item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
							'block px-3 py-2 rounded-md text-base font-medium'
						)}
						aria-current={item.current ? 'page' : undefined}
						>
						{item.name}
						</Disclosure.Button>
					))}
					</div>
				</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	)
}
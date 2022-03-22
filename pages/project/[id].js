import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState } from 'react'
import {BigNumber, ethers, utils} from "ethers"
import MyModal from '../../components/modal'
import {
    Block, BlockTag, BlockWithTransactions, EventType, Filter, FilterByBlockHash, ForkEvent,
    Listener, Log, Provider, TransactionReceipt, TransactionRequest, TransactionResponse
} from "@ethersproject/abstract-provider";
import { Deferrable, defineReadOnly, getStatic, resolveProperties } from "@ethersproject/properties";

import FAQ from "../../components/faq"
import Footer from "../../components/footer"
import Navbar from "../../components/navbar"
import { useEffect } from 'react'
import projectContract from "../../interface/projectContract.json"

const contractAddressRinkeby = "0x6E4EC75096C050Cda0467fD9DC0D35496538b019";
const contractAddress = "0x2b33a306F68f208C97d0DbdbE702431b22745377"; // mumbai matic
export default function Project() {
	let [isOpen, setIsOpen] = useState(false);
	const router = useRouter()
  	const { id } = router.query
	const [account, setAccount] = useState("");
	const [ html , setHtml] = useState("");
	const [ reqButtonShow, setReqButtonShow ] = useState(false);
	const [project, setProject] = useState([]);

	const [requests, setRequests] = useState([]);
	const [amountToFund, setAmount] = useState()
	const [myFunds, setMyFunds] = useState(0);

	const [deadline, setDeadline ] = useState({});

	// state for withdraw
	const [amountToWithdraw, setAmountToWithdraw] = useState(0);
	const [description, setDescription ] = useState("");
	const [receiptent, setReceiptent] = useState("");
	
	const [isReadMore, setIsReadMore] = useState(false);
	const [projectDescription, setProjectDescription] = useState("")

	useEffect(() => {getProject(id)}, [id])
	useEffect(() => {unixToDate()}, [project])

	async function getProject(id) {
		console.log(id)
		let account = await ethereum.request({ method: 'eth_accounts' });
		setAccount(account[0]);

		const provider = new ethers.providers.Web3Provider(window.ethereum);

		const signer = provider.getSigner();
		const contract = new ethers.Contract(contractAddress, projectContract.abi, provider);

		try {
			console.log(id)
			let getProject = await contract.getDetails(Number(id));
			setProject(getProject)
			console.log(getProject);

			await myContribution(id)
			if (getProject.creator.toLowerCase() == account[0].toLowerCase() ) {
				setReqButtonShow(true);
				// console.log(reqButtonShow);

				
			}
		


		}
		catch (e) {
			console.log(e);
		}

		await getAllRequest();

	}

	async function fundProject() {
		console.log(amountToFund);
		getProject(id)
		let provider = new ethers.providers.Web3Provider(window.ethereum);
		let signer = provider.getSigner();
		let contract = new ethers.Contract(contractAddress, projectContract.abi, signer);


        let Account = await ethereum.request({ method: 'eth_accounts' });


		const blocktag = await provider._getBlockTag();
		// console.log(blocktag);

		const result = await provider.getBalance(Account[0], blocktag);

		// console.log(Number(result));
		let balance = ethers.utils.formatEther(result);
		// console.log(balance);


		if(amountToFund == "" || amountToFund <= 0) {
			alert("funding amount can't be 0 or less since you can't pour from an empty cup");
		}
		else if (balance <= amountToFund ) {
			alert("amount to contribute is more than you balance, can't contribute");
		}
		else if (Account[0].toLowerCase() == project.creator.toLowerCase()) {
			alert("project creator can't contribute")

		}
		else {
			try {
				let amountToContribute  = utils.parseEther(amountToFund);
				const options = {value: amountToContribute }
				let fundProjectTxn = await contract.contribute(Number(id), options);
			
				let fundTxn = await fundProjectTxn.wait();
				console.log(fundProjectTxn);
				console.log(fundTxn.logs[1].address);
				let html = `${fundTxn.logs[1].address}`
							setHtml(html);

				getProject(id)
			} catch (e) {
				console.log(`e`, e)
				alert(e.message, "project is expired or succesfull, consider updating the state (from button below fund project) so that it can appear on the project that the project is expired for everyone" )
			}
		}
	}

	async function getRefund() {
		let provider = new ethers.providers.Web3Provider(window.ethereum);
		let signer = provider.getSigner();
		let contract = new ethers.Contract(contractAddress, projectContract.abi, signer);
		try {
		let refundtxn  = await contract.getRefund(Number(id));
		await refundtxn.wait();

		// alert("refund status",refundtxn)
		getProject(id)

		}
		catch (e) {
			alert(e.message);
		}

	}
	async function unixToDate() {
		let unixTime = Number(project.deadline)*1000 // unix time in milliseconds

		const dateObject = new Date(unixTime);
		const humanDateFormat = dateObject.toLocaleString() // 2021-12-9 10:34:30
		let dateDeadline = {
			 day: `${dateObject.toLocaleString("en-Us", {day: "numeric"})}`,
			 month: `${dateObject.toLocaleString("en-Us", {month: "long"})}`,
			 year: `${dateObject.toLocaleString("en-Us", {year: "numeric"})}`,
			 hour: `${dateObject.toLocaleString("en-Us", {hour: "numeric"})}`,
			 minute: `${dateObject.toLocaleString("en-Us", {minute: "numeric"})}`,
			 second: `${dateObject.toLocaleString("en-Us", {second: "numeric"})}`,
			 timeZone: `${dateObject.toLocaleString("en-Us", {timeZoneName: "short"})}`
		}
		setDeadline(dateDeadline);
	}

	async function updateStatus() {
		let provider = new ethers.providers.Web3Provider(window.ethereum);
		let signer = provider.getSigner();
		let contract = new ethers.Contract(contractAddress, projectContract.abi, signer);

		let check = await contract.checkIfFundingCompleteOrExpired(Number(id));
		await check.wait();
		getProject(id)
	}


	async function vote(e) {
		let provider = new ethers.providers.Web3Provider(window.ethereum);
		let signer = provider.getSigner();
		let contract = new ethers.Contract(contractAddress, projectContract.abi, signer);
		try {
			console.log(e.currentTarget.id);

			let votetxn  = await contract.voteRequest(Number(id), e.currentTarget.id);
			await votetxn.wait();
			getProject(id)
		}
		catch (e) {
			alert(e);
		}
	}



	async function myContribution() {
		let provider = new ethers.providers.Web3Provider(window.ethereum);
		let signer = provider.getSigner();
		let contract = new ethers.Contract(contractAddress, projectContract.abi, provider);
		console.log(id);
		let accounts = await ethereum.request({ method: 'eth_accounts' });
		console.log("account is ", accounts[0]);


		let myFunding = await contract.myContributions(Number(id), accounts[0]);

		console.log(myFunding);
		setMyFunds((Number(myFunding)/1000000000000000000).toFixed(6));
	}

	async function getAllRequest() {
		let provider = new ethers.providers.Web3Provider(window.ethereum);
		let contract = new ethers.Contract(contractAddress, projectContract.abi, provider);


		try {
			let allRequests = await contract.getAllRequests(Number(id));
			setRequests(allRequests);
			console.log(allRequests);



		} catch (e) {
			console.log(e)
		}

	}

	async function createRequest() {
		if(account.toLowerCase() != project.creator.toLowerCase() ) {
			alert("You are not the creator of this project/campaign so you can't create request");
		}

		let provider = new ethers.providers.Web3Provider(window.ethereum);
		let signer = provider.getSigner();
		let contract = new ethers.Contract(contractAddress, projectContract.abi, signer);


		try {
			let amount = ethers.utils.parseEther(amountToWithdraw);
			console.log(amount, description, receiptent);
			let createRequestTxn = await contract.createRequest(Number(id), description, amount, receiptent);
			await createRequestTxn.wait();
			console.log("request created");
			getAllRequest();
		} catch (e) {
			alert(e.message)
		}
	}

  async function createRequestButtonHandler() {
	let Account = await ethereum.request({ method: 'eth_accounts' });
	if (Account[0].toLowerCase() !== project.creator.toLowerCase()) {
		alert("only project creator can create requests for withdrawal")

	}

	else {
		setIsOpen(true)

	}
  }

	return (
		<div className="w-full h-full bg-cover bg custom-img bg-fixed">
			<Navbar></Navbar>
			<div className="bg w-full h-screen flex flex-col justify-center items-center">
				<div className='flex justify-center '>
					<img src={project.img} alt="" className='h-96 -translate-x-44 mt-12' />
					<div className="py-10 lg:pt-6 lg:pb-16 lg:col-start-1 lg:col-span-2 glass rounded-xl p-6">
						{/* Description and details */}
						<div className="w-96 lg:col-span-2 lg:border-gray-200">
							<h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{project.title}</h1>
						</div>

						<div>
							<h3 className="sr-only">Description</h3>

							<div className="space-y-6 mt-5 mb-5">
								<p className="text-base text-ellipsis overflow-hidden" style={{ maxHeight:"96px", maxWidth:"460px" }}>
									{project.description}
								</p>
							</div>
							<a onClick={() => {setIsReadMore(true); setProjectDescription(project.description)}} className='bg-gray-900 text-white px-3 py-2 rounded-md text-md font-medium hover:bg-gray-400 hover:text-black'>Read More</a>
						</div>

						<div className="mt-4">
							<h3 className="text-xl font-semibold text-gray-900">Stats</h3>

							<div className="mt-4">
								<ul role="list" className="pl-4 list-disc text-base space-y-2">
									<li className="">
										{project.state == 0 && <span className="text-inter">Status :- Fundraising</span>}
										{project.state == 1 && <span className="text-inter">Status :- Expired</span>}
										{project.state == 2 &&<span className="text-inter">Status :- Succesful</span>}
									</li>
									<li className="">
										Deadline - {deadline.timeZone}
									</li>
									<li className="">
										Total Contributors - {Number(project.noOfContributors)}
									</li>
									<li className="">
										<span className="text-inter"> { project.state == 0 && <span> Raised </span> } { project.state !== 0 && <span>Balance </span> }  {(Number(project.currentBalance)/1000000000000000000).toFixed(2)} MATIC</span>
									</li>
									<li className="">
										<span className="text-inter">Goal {Number(project.amountGoal)/1000000000000000000} MATIC</span>
									</li>
									<li className="">
										<span className="text-inter">
											{Number(project.amountGoal) > (Number(project.currentBalance)) && <span>Needed {(Number(project.amountGoal)/1000000000000000000 - Number(project.currentBalance)/1000000000000000000).toFixed(3)} MATIC </span> }
											{Number(project.amountGoal) < (Number(project.currentBalance)) && <span>Needed 0 MATIC</span> }
										</span>
									</li>
								</ul>
							</div>
						</div>
						<div className="mt-10">
							<h3 className="text-lg font-medium text-gray-900 mb-2">You Invested - {myFunds} </h3>
							<div>
								<input class="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none" id="funding" type="text" placeholder="Invest" onChange={(e)=> setAmount(e.currentTarget.value)} />
								<button onClick={fundProject}>
									<a className='bg-green-500 cursor-pointer text-white ml-5 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700'>Fund this Project</a>
								</button>

								<br />
                             { html != "0x0000000000000000000000000000000000001010"  && html != "" && <a href={"https://mumbai.polygonscan.com/token/" + html} > <button className='bg-purple-700 text-white mt-2  px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-900'> See NFT Txn</button> </a>    }                            
                              {  html != "0x0000000000000000000000000000000000001010"  && html != "" && <a href={"https://testnets.opensea.io/assets/mumbai/" + html + "/0"} > <button className='bg-purple-700 mt-2 text-white   px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-900'> See NFT on Opensea</button> </a> }                               
								<br />
								{project.state == 1 && <a className='bg-red-500 text-white  cursor-pointer px-3 py-2 rounded-md text-sm mr-2 font-medium hover:bg-red-700' onClick={getRefund}> Get Refund</a>}

								<button onClick={updateStatus} className='mt-4'>
									<a className='bg-purple-700 text-white  px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-900 '>update status</a>
								</button>
							</div>
						</div>
					</div>
			</div>
			</div>
			{   <div className="w-full mx-auto rounded-xl  flex justify-start items-center flex-col">
					<h1 className='text-4xl font-bold mb-5 mt-10'> Project Withdrawal Requests</h1>
					<a  className=' text-black px-3 py-2 text-xl font-medium mr-12 '> Balance - {(Number(project.currentBalance)/1000000000000000000).toFixed(5)} </a>


					{reqButtonShow== true &&  <a onClick={() => createRequestButtonHandler() } className='bg-gray-900 text-white px-3 py-2 rounded-md text-base font-normal cursor-pointer hover:text-white mr-12 '> Create Withdrawal Request</a>}
					<div className="grid grid-cols-3 grid-rows-2 gap-10 m-10">


					{requests.slice(0).reverse().map( (request) => (<div className="p-4 md:w-full w-full">
						  {/* <div className="h-full glass p-8 rounded-lg"> */}
						  <div class="w-full -mb-60 overflow-hidden flex flex-col justify-center items-center">
										<div class="max-w-md h-full w-full glass rounded-xl p-5">
											<div class="flex flex-col">
												<div class="">
													{/* <div class="relative h-62 w-full mb-3">
														<img src={project.img} alt="Just a flower" class=" w-full  object-fill rounded-2xl" style={{ height:"250px" }} />
													</div> */}
													<div class="flex-auto justify-evenly">
														<div class="flex flex-wrap ">
															<div class="flex items-center w-full justify-between min-w-0 ">
																<h2 onClick={() => {setIsReadMore(true); setProjectDescription(request.desc)}} class="text- mr-auto cursor-pointer text-gray-700 hover:text-purple-500 truncate ">{request.desc}</h2>
																{!request.status && <div class="flex items-center bg-red-500 cursor pointer text-white text-xs px-2 py-1 ml-3 rounded-lg">Pending
																</div>}
																{request.status && <div class="flex items-center bg-green-500 cursor pointer text-gwhite text-xs px-2 py-1 ml-3 rounded-lg">Completed
																</div>}
																{/* {!request.status && "Pending"} {request.status && "Completed"} */}
															</div>
														</div>
														{/* <div class="text-lg text-gray-900 font-semibold mt-1 mb-4">
															{project.title}
														</div> */}
														<div class="flex justify-between item-center text-gray-900 my-4">
															<div class="flex flex-col justify-center gap-4">
																<span className="bg-gray-100 rounded-xl p-2">Request ID -   {Number(request.requestId)}</span>
																<span className="bg-gray-100 rounded-xl p-2">Withdrawal Address  - {request.receipient}</span>
																<span className="bg-gray-100 rounded-xl p-2">Withdrawal Value  - {(Number(request.value)/1000000000000000000).toFixed(3)}</span>
																<span className="bg-gray-100 rounded-xl p-2">Withdrawal Fee (3%) - {(Number(request.value)*3/100000000000000000000).toFixed(3)}</span>
																<span className="bg-gray-100 rounded-xl p-2">Total Current Votes  - {Number(request.noOfVoter)}</span>
																<span className="bg-gray-100 rounded-xl p-2">Votes Required For Withdrawal  - {Math.round((Number(project.noOfContributors) - Number(request.noOfVoter))/2)}</span>
															</div>
														</div>


														<div class="flex text-sm font-medium justify-start">
															{!request.status && <button id={Number(request.requestId)} onClick={(e) => {vote(e)}} class="transition ease-in duration-100 inline-flex items-center text-sm font-medium mb-2 md:mb-0 bg-purple-700 px-5 py-2 hover:shadow-lg tracking-wider text-white rounded-full hover:bg-purple-700 ">
																<span>Vote this request</span>
															</button>}
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
				  </div>) )}




					</div>
				</div> }
				<MyModal isOpen={isOpen} setIsOpen={setIsOpen} title='Start a Project'>
				<form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
					<div className="mb-4">
						<label className="block text-gray-700 text-sm font-bold mb-2" for="description">
							Request Description
						</label>
						<input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="description" onChange={(e) => setDescription(e.currentTarget.value)} type="text" placeholder="description" />
					</div>
					<div className="mb-4">
						<label className="block text-gray-700 text-sm font-bold mb-2" for="amount">
							Request  Amount
						</label>
						<input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={(e) => setAmountToWithdraw(e.currentTarget.value)} id="amount" type="number" placeholder="request Amount" />
					</div>
					<div className="mb-4">
						<label className="block text-gray-700 text-sm font-bold mb-2" for="location">
							Receiptent Address
						</label>
						<input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={(e)=> setReceiptent(e.currentTarget.value)} id="address" type="text" placeholder="address of the receiptent" />
					</div>
					<a onClick={() =>{ setIsOpen(false)
					createRequest() } } className='bg-gray-900 text-white px-3 py-2 rounded-md text-xl font-medium hover:bg-gray-400 hover:text-black mr-12'> Create Withdrawal Request</a>
				</form>
			</MyModal>

			<MyModal isOpen={isReadMore} setIsOpen={setIsReadMore} title="Read More">
				{projectDescription}
			</MyModal>

			<FAQ></FAQ>
			<Footer></Footer>
		</div>
	)
}

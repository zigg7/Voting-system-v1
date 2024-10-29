import { useState, useEffect } from 'react';
import Web3 from 'web3';
import './App.css';

// Replace this with your deployed contract address
const contractAddress = "0xE4b19EC4991b31466AE30e4EB6203504661FC0e6";

// ABI for the VotingNFT contract
const contractABI = [
    {
        "inputs": [],
        "name": "voteForLong",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "voteForKawser",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVotes",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

function App() {
    const [account, setAccount] = useState('');
    const [candidates, setCandidates] = useState([
        { name: 'Long', voteCount: 0 },
        { name: 'Kawser', voteCount: 0 }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());
            checkIfWalletIsConnected();
        } else {
            setError('Please install MetaMask!');
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            setAccount('');
        } else if (accounts[0] !== account) {
            setAccount(accounts[0]);
            fetchCandidates();
        }
    };

    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) return;

            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                await fetchCandidates();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
            setError('Error checking wallet connection');
        }
    };

    const connectWallet = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                setError('Please install MetaMask!');
                return;
            }

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            await fetchCandidates();
            setError('');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            setError(error.message || 'Error connecting wallet');
        }
    };

    const fetchCandidates = async () => {
        try {
            const web3 = new Web3(window.ethereum);
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            // Call getVotes() from the contract
            const votes = await contract.methods.getVotes().call();
            const longVotes = parseInt(votes[0], 10);
            const kawserVotes = parseInt(votes[1], 10);

            setCandidates([
                { name: 'Long', voteCount: longVotes },
                { name: 'Kawser', voteCount: kawserVotes }
            ]);
        } catch (error) {
            console.error('Error fetching votes:', error);
            setError('Failed to fetch vote counts. See console for details.');
        }
    };

    const castVote = async (candidateId) => {
        try {
            const web3 = new Web3(window.ethereum);
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            setIsLoading(true);
            setError('');

            const method = candidateId === 0 ? 'voteForLong' : 'voteForKawser';

            // Send transaction
            await contract.methods[method]().send({ from: account });

            await fetchCandidates();
            setError('');
        } catch (error) {
            console.error('Error casting vote:', error);
            setError('Failed to cast vote. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 min-h-screen flex flex-col items-center bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-8 text-center">VOTING SYSTEM</h1>

            <button
                className="bg-green-600 hover:bg-green-500 text-black font-bold py-2 px-4 rounded mb-4"
                onClick={account ? () => setAccount('') : connectWallet}
            >
                {account ? 'Disconnect Wallet' : 'Connect Wallet'}
            </button>

            {account && (
                <p className="text-sm mb-2">
                    Connected: {account.slice(0, 6)}...{account.slice(-4)}
                </p>
            )}

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="grid grid-cols-1 gap-6 mt-6">
                {candidates.map((candidate, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md">
                        <div className="text-xl mb-2 text-center">{candidate.name}</div>
                        <div className="text-lg mb-4 text-center">Votes: {candidate.voteCount}</div>
                        <button
                            className="bg-blue-600 hover:bg-blue-500 text-black font-bold py-2 px-4 w-full rounded"
                            onClick={() => castVote(index)}
                            disabled={!account || isLoading}
                        >
                            {isLoading ? 'Voting...' : 'Vote'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
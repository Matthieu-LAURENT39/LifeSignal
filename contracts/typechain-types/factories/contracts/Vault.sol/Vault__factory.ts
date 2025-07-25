/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../common";
import type { Vault, VaultInterface } from "../../../contracts/Vault.sol/Vault";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_vaultName",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ContactAlreadyAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "ContactNotAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "EmptyVaultName",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "NotOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "VaultDataAlreadySet",
    type: "error",
  },
  {
    inputs: [],
    name: "VaultDataNotSet",
    type: "error",
  },
  {
    inputs: [],
    name: "VaultNotReleased",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "contact",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "ContactAuthorized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "contact",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "ContactRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "VaultDataRetrieved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "VaultDataStored",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "newName",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "VaultNameUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
    ],
    name: "VaultReleased",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_contact",
        type: "address",
      },
    ],
    name: "addAuthorizedContact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "debugAuth",
    outputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "contractOwner",
        type: "address",
      },
      {
        internalType: "bool",
        name: "isOwnerMatch",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isInContacts",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "vaultReleased",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "shouldPass",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllAuthorizedContacts",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVaultData",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getVaultInfo",
    outputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "bool",
        name: "_released",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "_dataSet",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "_contactCount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_contact",
        type: "address",
      },
    ],
    name: "isContactAuthorized",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isReleased",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isVaultDataSet",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "releaseVault",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_contact",
        type: "address",
      },
    ],
    name: "removeAuthorizedContact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_encryptedData",
        type: "bytes",
      },
    ],
    name: "setDataEncrypt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_newName",
        type: "string",
      },
    ],
    name: "updateVaultName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "vaultName",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60a060405234610283576111308038038061001981610288565b928339810190602081830312610283578051906001600160401b038211610283570181601f82011215610283578051906001600160401b0382116102475761006a601f8301601f1916602001610288565b92828452602083830101116102835760005b82811061026e578360006020858301015280511561025d573360805280516001600160401b03811161024757600054600181811c9116801561023d575b602082101461022757601f81116101c3575b50602091601f821160011461016057918192600092610155575b50508160011b916000199060031b1c1916176000555b60ff1960015416600155604051610e8290816102ae823960805181818161016d0152818161043e015281816104df0152818161058c015281816107380152818161082f0152818161092e01528181610c6b0152610ce50152f35b0151905082806100e5565b601f1982169260008052806000209160005b8581106101ab57508360019510610192575b505050811b016000556100fb565b015160001960f88460031b161c19169055828080610184565b91926020600181928685015181550194019201610172565b600080527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563601f830160051c8101916020841061021d575b601f0160051c01905b81811061021157506100cb565b60008155600101610204565b90915081906101fb565b634e487b7160e01b600052602260045260246000fd5b90607f16906100b9565b634e487b7160e01b600052604160045260246000fd5b632b69ef4960e01b60005260046000fd5b8060208092840101518282870101520161007c565b600080fd5b6040519190601f01601f191682016001600160401b038111838210176102475760405256fe6080604052600436101561001257600080fd5b60003560e01c80630ace9ca014610ae55780631f1a71d7146108b157806328b622d2146108135780633838fe73146107105780634b0f5728146105645780634bb2baa31461054157806363b1152a146104cc5780637b17266c146104895780637f98aa7114610402578063875e407a14610336578063893d20e8146103315780638da5cb5b14610331578063da27d7911461011d578063fa2a8997146100fa5763fef840ff146100c157600080fd5b346100f55760003660031901126100f5576100f16100dd610ce2565b604051918291602083526020830190610c14565b0390f35b600080fd5b346100f55760003660031901126100f557602060ff600154166040519015158152f35b346100f55760203660031901126100f55760043567ffffffffffffffff81116100f557366023820112156100f557806004013567ffffffffffffffff81116100f55736602482840101116100f5577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031633036103205760ff6003541661030f576000906101b3600254610b01565b601f81116102b6575b5081601f821160011461023357819083946101ec9492610225575b50508160011b916000199060031b1c19161790565b6002555b600160ff196003541617600355337fe37d3d6d86b687443d0b6a0d614d27ff9023699bc507a42fe91053f6deba164a8280a280f35b6024925001013584806101d7565b601f198216937f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace91845b86811061029b575083600195961061027e575b505050811b016002556101f0565b0160240135600019600384901b60f8161c19169055838080610270565b9092602060018192602487870101358155019401910161025d565b600283526102ff907f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace601f840160051c81019160208510610305575b601f0160051c0190610c9a565b836101bc565b90915081906102f2565b63107a1fd560e21b60005260046000fd5b6330cd747160e01b60005260046000fd5b610c55565b346100f55760003660031901126100f5576040518060206005549283815201809260056000527f036b6384b5eca791c62761152d0c79bb0604c104a5fb6f4eb0703f3154bb3db09060005b8181106103e35750505081610397910382610b3b565b6040519182916020830190602084525180915260408301919060005b8181106103c1575050500390f35b82516001600160a01b03168452859450602093840193909201916001016103b3565b82546001600160a01b0316845260209093019260019283019201610381565b346100f55760003660031901126100f55761047160ff6001541660ff600354169060055461042e610b5d565b9260405194859460018060a01b037f000000000000000000000000000000000000000000000000000000000000000016865260a0602087015260a0860190610c14565b92151560408501521515606084015260808301520390f35b346100f55760203660031901126100f5576004356001600160a01b038116908190036100f5576000526004602052602060ff604060002054166040519015158152f35b346100f55760003660031901126100f5577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316330361032057600160ff1981541617600155337fd5859af634a05c1676c4e206a4f0a1743f733ed64e6645174fee172150f32cc4600080a2005b346100f55760003660031901126100f557602060ff600354166040519015158152f35b346100f55760203660031901126100f5576004356001600160a01b038116908190036100f5577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031633036103205780600052600460205260ff60406000205416156106ff576000818152600460205260408120805460ff191690555b60055490818110156106f857826105fe82610cb1565b905460039190911b1c6001600160a01b03161461061f5760019150016105e8565b60001982019182116106e25761065261063a61067693610cb1565b905460039190911b1c6001600160a01b031691610cb1565b81546001600160a01b0393841660039290921b91821b9390911b1916919091179055565b60055480156106cc576000190161068c81610cb1565b81549060018060a01b039060031b1b191690556005555b33907fcb0155b58744b4ee6e54e764bdb89963b2128f4a49c6e5d5aed26b301bb5a8f2600080a3005b634e487b7160e01b600052603160045260246000fd5b634e487b7160e01b600052601160045260246000fd5b50506106a3565b634748223f60e11b60005260046000fd5b346100f55760203660031901126100f5576004356001600160a01b038116908181036100f5577f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031633036103205781156106ff5781600052600460205260ff60406000205416610802578160005260046020526040600020600160ff1982541617905560055490680100000000000000008210156107ec576106528260016107c39401600555610cb1565b33907fc929ec71ea5d504b1c3ce248ffefdde4b70bad1ca8e3a10ec24d4c0a687957da600080a3005b634e487b7160e01b600052604160045260246000fd5b63d492165960e01b60005260046000fd5b346100f55760003660031901126100f55760c060018060a01b037f00000000000000000000000000000000000000000000000000000000000000001680331433600052600460205260ff6040600020541660ff600154169082801561089b575b60405194338652602086015260408501521515606084015215156080830152151560a0820152f35b925081806108aa575b92610873565b50806108a4565b346100f55760203660031901126100f55760043567ffffffffffffffff81116100f557366023820112156100f557806004013567ffffffffffffffff81116107ec576040519161090b601f8301601f191660200184610b3b565b81835236602483830101116100f5578160009260246020930183860137830101527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316330361032057805115610ad457805167ffffffffffffffff81116107ec5761097f600054610b01565b601f8111610a86575b506020601f8211600114610a045790806109b8926000916109f9575b508160011b916000199060031b1c19161790565b6000555b7f286bb1921653e708ac5b6ad4599e5173e73b914940eb328cba7471c200832c7a60405160208152806109f433946020830190610c14565b0390a2005b9050830151846109a4565b601f19821690600080527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5639160005b818110610a6e57509083600194939210610a55575b5050811b016000556109bc565b84015160001960f88460031b161c191690558380610a48565b91926020600181928689015181550194019201610a33565b60008052610ace907f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563601f840160051c8101916020851061030557601f0160051c0190610c9a565b82610988565b632b69ef4960e01b60005260046000fd5b346100f55760003660031901126100f5576100f16100dd610b5d565b90600182811c92168015610b31575b6020831014610b1b57565b634e487b7160e01b600052602260045260246000fd5b91607f1691610b10565b90601f8019910116810190811067ffffffffffffffff8211176107ec57604052565b6040519060008260005491610b7183610b01565b8083529260018116908115610bf55750600114610b97575b610b9592500383610b3b565b565b50600080805290917f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5635b818310610bd9575050906020610b9592820101610b89565b6020919350806001915483858901015201910190918492610bc1565b60209250610b9594915060ff191682840152151560051b820101610b89565b919082519283825260005b848110610c40575050826000602080949584010152601f8019910116010190565b80602080928401015182828601015201610c1f565b346100f55760003660031901126100f5576040517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b818110610ca5575050565b60008155600101610c9a565b600554811015610ccc57600560005260206000200190600090565b634e487b7160e01b600052603260045260246000fd5b337f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031614610d505760ff6001541615610d3f5733600052600460205260ff6040600020541615610d3f57610d3c610d54565b90565b63ea8e4eb560e01b60005260046000fd5b610d3c5b60ff6003541615610e3b57604051337f84893e6b945418b50268d87630732a9055d1d763d580114c986d89329f17440f600080a2600254816000610d9783610b01565b8083529260018116908115610e1c5750600114610dbb575b610d3c92500382610b3b565b509060026000527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace906000915b818310610e00575050906020610d3c92820101610daf565b6020919350806001915483858801015201910190918392610de8565b60209250610d3c94915060ff191682840152151560051b820101610daf565b631c32abd360e11b60005260046000fdfea26469706673582212200e0f9b6b808cbc6ab22f9c74c8bdad0d3cc651a9de8ae0f27d7f9bf3fec28eb564736f6c634300081c0033";

type VaultConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: VaultConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Vault__factory extends ContractFactory {
  constructor(...args: VaultConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _vaultName: string,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(_vaultName, overrides || {});
  }
  override deploy(
    _vaultName: string,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(_vaultName, overrides || {}) as Promise<
      Vault & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Vault__factory {
    return super.connect(runner) as Vault__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): VaultInterface {
    return new Interface(_abi) as VaultInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Vault {
    return new Contract(address, _abi, runner) as unknown as Vault;
  }
}

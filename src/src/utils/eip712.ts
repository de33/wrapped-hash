import type { Hex, TypedDataDomain, TypedDataParameter } from 'viem';
import { hashDomain as _hashDomain } from './hashTypedData';

export function makeEIP712DomainType(domain: TypedDataDomain): readonly TypedDataParameter[] {
  return [
    typeof domain?.name === 'string' && { name: 'name', type: 'string' },
    domain?.version && { name: 'version', type: 'string' },
    typeof domain?.chainId === 'number' && {
      name: 'chainId',
      type: 'uint256',
    },
    domain?.verifyingContract && {
      name: 'verifyingContract',
      type: 'address',
    },
    domain?.salt && { name: 'salt', type: 'bytes32' },
  ].filter(Boolean);
}

export function hashDomain(domain: TypedDataDomain): Hex {
  return _hashDomain({
    domain,
    types: { EIP712Domain: makeEIP712DomainType(domain) },
  });
}

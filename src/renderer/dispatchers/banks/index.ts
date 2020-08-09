import axios from 'axios';

import {setBankConfig, setBankConfigError} from '@renderer/store/banks';
import {BankConfig} from '@renderer/types/entities';
import {AppDispatch} from '@renderer/types/store';
import {NodeType} from '@renderer/types/api';

export const fetchBankConfig = (address: string) => async (dispatch: AppDispatch) => {
  try {
    const {data} = await axios.get<BankConfig>(`${address}/config`);

    if (data.node_type !== NodeType.bank) {
      dispatch(setBankConfigError({address, error: 'Node not a bank'}));
      return;
    }

    dispatch(setBankConfig({address, data}));
    return data;
  } catch (error) {
    if (!error.response) {
      throw error;
    }
    dispatch(setBankConfigError({address, error: error.response.data}));
  }
};

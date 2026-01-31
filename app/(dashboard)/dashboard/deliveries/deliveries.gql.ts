// app/(dashboard)/dashboard/deliveries/deliveries.gql.ts
import gql from "graphql-tag";

export const GET_DELIVERY_ORDERS = gql`
  query GetDeliveryOrders($first: Int!, $after: ID, $search: String, $statusIn: [OrderStatus!]) {
    getDeliveryOrders(first: $first, after: $after, search: $search, statusIn: $statusIn) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          orderNumber
          status
          orderDate
          deliveryTime
          deliveryAddress
          userName
          userPhone
          delivery {
            id
            orderNum
            driverName
            driverEmail
            driverPhone
          }
        }
      }
    }
  }
`;

export const MARK_DELIVERY_READY = gql`
  mutation MarkDeliveryReady($orderNumber: String!) {
    markDeliveryReady(orderNumber: $orderNumber) {
      id
      status
    }
  }
`;
export const GET_DELIVERY_DRIVERS = gql`
  query GetDeliveryDrivers {
    getUsers {
      id
      name
      email
      role
      profile {
        phone
      }
    }
  }
`;
export const ASSIGN_DRIVER_TO_ORDER = gql`
  mutation AssignDriverToOrder(
    $orderNumber: String!
    $driverName: String!
    $driverEmail: String!
    $driverPhone: String!
  ) {
    assignDriverToOrder(
      orderNumber: $orderNumber
      driverName: $driverName
      driverEmail: $driverEmail
      driverPhone: $driverPhone
    ) {
      id
      orderNum
      driverName
      driverEmail
      driverPhone
    }
  }
`;

export const REMOVE_DRIVER_FROM_ORDER = gql`
  mutation RemoveDriverFromOrder($orderNumber: String!) {
    removeDriverFromOrder(orderNumber: $orderNumber)
  }
`;

export const MARK_DELIVERY_DELIVERED = gql`
  mutation MarkDeliveryDelivered($orderNumber: String!) {
    markDeliveryDelivered(orderNumber: $orderNumber) {
      id
      status
      deliveryTime
    }
  }
`;
